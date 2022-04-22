/* eslint-disable no-console */
import Web3 from 'web3'
import { toBN } from 'web3-utils'
import tornABI from '../abis/ERC20.abi.json'

import { isWalletRejection } from '@/utils'

const { toWei, toHex, numberToHex } = require('web3-utils')
const { PermitSigner } = require('../lib/Permit')

const state = () => {
  return {
    approvalAmount: 'unlimited',
    allowance: '0',
    balance: '',
    signature: {
      v: '',
      r: '',
      s: '',
      amount: '',
      deadline: 0
    }
  }
}

const getters = {
  tokenContract: (state, getters, rootState, rootGetters) => {
    const tornContract = rootGetters['metamask/networkConfig']['torn.contract.tornadocash.eth']
    const { url } = rootGetters['settings/currentRpc']
    const web3 = new Web3(url)
    return new web3.eth.Contract(tornABI, tornContract)
  }
}

const mutations = {
  SET_APPROVAL_AMOUNT(state, { approvalAmount }) {
    state.approvalAmount = approvalAmount
  },
  SAVE_ALLOWANCE(state, { allowance }) {
    this._vm.$set(state, 'allowance', allowance)
  },
  SAVE_BALANCE(state, { balance }) {
    this._vm.$set(state, 'balance', balance)
  },
  SAVE_SIGNATURE(state, { v, r, s, amount, deadline }) {
    this._vm.$set(state, 'signature', { v, r, s, amount, deadline })
  },
  REMOVE_SIGNATURE(state) {
    this._vm.$set(state, 'signature', { v: '', r: '', s: '', amount: '', deadline: 0 })
  }
}

const actions = {
  async approve({ rootState, getters, commit, dispatch, rootGetters, state }, { amount }) {
    try {
      console.log('call approve')
      const netId = rootGetters['metamask/netId']
      const govInstance = rootGetters['governance/gov/govContract']({ netId })
      const amountToApprove = toHex(toWei(amount.toString()))
      const data = getters.tokenContract.methods
        .approve(govInstance._address, amountToApprove.toString())
        .encodeABI()
      const gas = 100000

      const callParams = {
        method: 'eth_sendTransaction',
        params: {
          data,
          gas: numberToHex(gas + 100000),
          to: getters.tokenContract._address
        },
        watcherParams: {
          title: 'approve',
          successTitle: 'approved'
        },
        isSaving: false
      }

      await dispatch('metamask/sendTransaction', callParams, { root: true })

      dispatch('fetchTokenAllowance')
    } catch (e) {
      console.error('approve action', e)
      throw new Error(e.message)
    }
  },
  async fetchTokenAllowance({ getters, rootGetters, commit, rootState }) {
    const netId = rootGetters['metamask/netId']
    const { ethAccount } = rootState.metamask

    if (!ethAccount) {
      return
    }

    const govInstance = rootGetters['governance/gov/govContract']({ netId })
    try {
      const allowance = await getters.tokenContract.methods.allowance(ethAccount, govInstance._address).call()
      commit('SAVE_ALLOWANCE', { allowance })

      return allowance
    } catch (e) {
      console.error('fetchTokenAllowance', e.message)
    }
  },
  async fetchTokenBalance({ state, getters, rootGetters, commit, rootState }) {
    try {
      const { ethAccount } = rootState.metamask
      if (ethAccount) {
        const balance = await getters.tokenContract.methods.balanceOf(ethAccount).call()
        console.log('torn', balance)
        commit('SAVE_BALANCE', { balance })
      }
    } catch (e) {
      console.error('fetchTokenBalance', e.message)
    }
  },
  async detectedAllowance({ dispatch }, initValue) {
    try {
      const allowance = await dispatch('fetchTokenAllowance')

      if (toBN(allowance).gte(initValue)) {
        return true
      }
      setTimeout(() => {
        return dispatch('detectedAllowance', initValue)
      }, 5000)
    } catch (err) {
      console.error('detectedAllowance has error', err.message)
      setTimeout(() => {
        return dispatch('detectedAllowance', initValue)
      }, 5000)
    }
  },
  async signApprove({ rootState, getters, rootGetters, dispatch, commit }, { amount }) {
    try {
      const { ethAccount } = rootState.metamask
      const netId = rootGetters['metamask/netId']
      const govInstance = rootGetters['governance/gov/govContract']({ netId })

      const domain = {
        name: 'TornadoCash',
        version: '1',
        chainId: netId,
        verifyingContract: getters.tokenContract._address
      }
      const oneDayFromNow = Math.ceil(Date.now() / 1000) + 86400
      // fetch nonces
      let nonce = 0
      try {
        nonce = await getters.tokenContract.methods.nonces(ethAccount).call()
        console.log('nonce', nonce)
      } catch (e) {
        throw new Error(e.message)
      }

      // const pre = toHex(toWei(amount.toString())).substr(2)
      // let result = pre.length % 2 === 0 ? pre : '0' + pre
      // result = '0x' + result

      const value = toWei(amount.toString())

      const args = {
        owner: ethAccount,
        spender: govInstance._address,
        value, // 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
        nonce,
        deadline: oneDayFromNow
      }

      const permitSigner = new PermitSigner(domain, args)
      const message = permitSigner.getPayload()

      const callParams = {
        method: 'eth_signTypedData_v4',
        params: [ethAccount, JSON.stringify(message)]
      }

      dispatch(
        'loading/changeText',
        {
          message: this.app.i18n.t('pleaseSignRequestInWallet', {
            wallet: rootState.metamask.walletName
          }),
          type: 'approve'
        },
        { root: true }
      )

      let signature = await this.$provider.sendRequest(callParams)
      signature = signature.substring(2)
      const r = '0x' + signature.substring(0, 64)
      const s = '0x' + signature.substring(64, 128)
      let v = parseInt(signature.substring(128, 130), 16)

      // fix ledger sign
      if (v === 0 || v === 1) {
        v = v + 27
      }

      console.log('signature', v, r, s, signature)

      // signature validation on contract
      await getters.tokenContract.methods
        .permit(args.owner, args.spender, args.value, args.deadline, v, r, s)
        .call()

      commit('SAVE_SIGNATURE', { v, r, s, amount, deadline: oneDayFromNow })
    } catch (e) {
      console.error('signApprove', e.message)
      if (!isWalletRejection(e)) {
        setTimeout(async () => {
          await dispatch('approve', { amount })
          dispatch('detectedAllowance', amount)
        }, 1000)
      }
    } finally {
      dispatch('loading/disable', {}, { root: true })
    }
  }
}
export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
