import Web3 from 'web3'
import { numberToHex, fromWei } from 'web3-utils'

import networkConfig from '@/networkConfig'

import TornadoStakingRewardsABI from '@/abis/TornadoStakingRewards.abi.json'

export const state = () => {
  return {
    accumulatedReward: '0',
    isCheckingReward: false
  }
}

export const getters = {
  stakingRewardsContract: (state, getters, rootState) => ({ netId }) => {
    const config = networkConfig[`netId${netId}`]
    const { url } = rootState.settings[`netId${netId}`].rpc
    const address = config['staking-rewards.contract.tornadocash.eth']

    if (address) {
      const web3 = new Web3(url)
      return new web3.eth.Contract(TornadoStakingRewardsABI, address)
    }

    return null
  },
  reward: (state) => {
    return fromWei(state.accumulatedReward)
  },
  isCheckingReward: (state) => {
    return state.isCheckingReward
  }
}

export const mutations = {
  SAVE_ACCUMULATED_REWARD(state, payload) {
    state.accumulatedReward = payload
  },
  SAVE_CHECKING_REWARD(state, payload) {
    this._vm.$set(state, 'isCheckingReward', payload)
  }
}

export const actions = {
  async checkReward({ getters, rootGetters, rootState, commit }) {
    try {
      commit('SAVE_CHECKING_REWARD', true)

      const netId = rootGetters['metamask/netId']
      const { ethAccount } = rootState.metamask
      const stakingRewardsInstance = getters.stakingRewardsContract({ netId })

      if (!stakingRewardsInstance) {
        return
      }

      const reward = await stakingRewardsInstance.methods.checkReward(ethAccount).call()

      commit('SAVE_ACCUMULATED_REWARD', reward)
    } catch (err) {
      console.error('checkReward', err.message)
    } finally {
      commit('SAVE_CHECKING_REWARD', false)
    }
  },
  async claimReward({ state, getters, rootGetters, rootState, commit, dispatch }) {
    try {
      const netId = rootGetters['metamask/netId']
      const { ethAccount } = rootState.metamask
      const stakingRewardsInstance = getters.stakingRewardsContract({ netId })

      if (!stakingRewardsInstance) {
        return
      }

      const data = await stakingRewardsInstance.methods.getReward().encodeABI()
      const gas = await stakingRewardsInstance.methods.getReward().estimateGas({ from: ethAccount, value: 0 })

      const currency = 'TORN'
      const amount = rootGetters['token/toDecimals'](state.accumulatedReward, 18)

      const callParams = {
        method: 'eth_sendTransaction',
        params: {
          to: stakingRewardsInstance._address,
          gas: numberToHex(gas + 100000),
          data
        },
        watcherParams: {
          title: {
            path: 'claiming',
            amount,
            currency
          },
          successTitle: {
            path: 'claimedValue',
            amount,
            currency
          },
          storeType: 'govTxs',
          onSuccess: () => {
            dispatch('torn/fetchTokenBalance', {}, { root: true })
            dispatch('checkReward')
          }
        },
        isSaving: false
      }

      const txHash = await dispatch('metamask/sendTransaction', callParams, { root: true })

      commit(
        'txHashKeeper/SAVE_TX_HASH',
        {
          txHash,
          storeType: 'govTxs',
          type: 'Reward',
          netId
        },
        { root: true }
      )
    } catch (err) {
      console.error('claimReward', err.message)
      dispatch(
        'notice/addNoticeWithInterval',
        {
          notice: {
            title: 'internalError',
            type: 'danger'
          },
          interval: 3000
        },
        { root: true }
      )
    }
  }
}
