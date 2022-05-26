/* eslint-disable no-console */
import Web3 from 'web3'
import { GasPriceOracle } from 'gas-price-oracle'
import { serialize } from '@ethersproject/transactions'
import { toHex, toWei, toBN, fromWei } from 'web3-utils'

import networkConfig from '@/networkConfig'
import OvmGasPriceOracleABI from '@/abis/OvmGasPriceOracle.abi.json'
import { DUMMY_NONCE, DUMMY_WITHDRAW_DATA } from '@/constants/variables'

export const state = () => {
  return {
    oracle: {
      instant: 80,
      fast: 50,
      standard: 25,
      low: 8
    },
    eip: {
      instant: {
        baseFee: 80,
        maxFeePerGas: 80,
        maxPriorityFeePerGas: 3
      },
      fast: {
        baseFee: 50,
        maxFeePerGas: 50,
        maxPriorityFeePerGas: 3
      },
      standard: {
        baseFee: 25,
        maxFeePerGas: 27,
        maxPriorityFeePerGas: 2
      },
      low: {
        baseFee: 8,
        maxFeePerGas: 9,
        maxPriorityFeePerGas: 1
      }
    },
    l1Fee: '0'
  }
}

export const getters = {
  ovmGasPriceOracleContract: (state, getters, rootState) => ({ netId }) => {
    const config = networkConfig[`netId${netId}`]
    const { url } = rootState.settings[`netId${netId}`].rpc
    const address = config.ovmGasPriceOracleContract
    if (address) {
      const web3 = new Web3(url)
      return new web3.eth.Contract(OvmGasPriceOracleABI, address)
    }

    return null
  },
  l1Fee: (state) => {
    return state.l1Fee
  },
  oracle: (state, getters, rootState, rootGetters) => {
    const netId = Number(rootGetters['metamask/netId'])
    const { gasPrices } = rootGetters['metamask/networkConfig']

    return new GasPriceOracle({
      chainId: netId,
      defaultRpc: rootGetters['settings/currentRpc'].url,
      defaultFallbackGasPrices: gasPrices
    })
  },
  eipSupported: (state, getters, rootState, rootGetters) => {
    const netId = rootGetters['metamask/netId']
    const networksWithEIP1559 = [1, 5]

    return networksWithEIP1559.includes(netId)
  },
  getGasParams: (state, getters) => (speed = 'fast', isDisable = false) => {
    const { maxFeePerGas, maxPriorityFeePerGas } = state.eip[speed]

    if (!isDisable && getters.eipSupported) {
      return {
        maxFeePerGas: toHex(maxFeePerGas),
        maxPriorityFeePerGas: toHex(maxPriorityFeePerGas)
      }
    }

    return {
      gasPrice: getters.getGasPrice(speed)
    }
  },
  getGasPrice: (state, getters) => (speed = 'fast') => {
    const gasPrices = getters.gasPrices
    return toHex(toWei(gasPrices[speed].toString(), 'gwei'))
  },
  fastGasPrice: (state, getters) => {
    return getters.getGasPrice('fast')
  },
  gasPrices: (state, getters) => {
    const parseGwei = (value) => String(Math.floor(Number(fromWei(String(value), 'gwei')) * 100) / 100)

    const { eip, oracle } = state

    if (getters.eipSupported) {
      return {
        instant: parseGwei(eip.instant.maxFeePerGas),
        low: parseGwei(eip.low.maxFeePerGas),
        standard: parseGwei(eip.standard.maxFeePerGas),
        fast: parseGwei(eip.fast.maxFeePerGas)
      }
    }

    return {
      instant: String(oracle.instant),
      low: String(oracle.low),
      standard: String(oracle.standard),
      fast: String(oracle.fast)
    }
  }
}

export const mutations = {
  SAVE_ORACLE_GAS_PRICES(state, { instant, fast, standard, low }) {
    this._vm.$set(state.oracle, 'instant', instant)
    this._vm.$set(state.oracle, 'fast', fast)
    this._vm.$set(state.oracle, 'standard', standard)
    this._vm.$set(state.oracle, 'low', low)
  },
  SAVE_EIP_GAS_PRICES(state, { instant, fast, standard, low }) {
    this._vm.$set(state.eip, 'instant', instant)
    this._vm.$set(state.eip, 'fast', fast)
    this._vm.$set(state.eip, 'standard', standard)
    this._vm.$set(state.eip, 'low', low)
  },
  SAVE_L1_FEE(state, l1Fee) {
    state.l1Fee = l1Fee
  }
}

export const actions = {
  async fetchGasPrice({ getters, commit, dispatch, rootGetters, state }) {
    const { pollInterval } = rootGetters['metamask/networkConfig']

    try {
      if (getters.eipSupported) {
        const result = await dispatch('estimateFees')
        commit('SAVE_EIP_GAS_PRICES', result)
      } else {
        const gas = await dispatch('getGasPrice')
        commit('SAVE_ORACLE_GAS_PRICES', gas)
      }

      await dispatch('fetchL1Fee')

      setTimeout(() => dispatch('fetchGasPrice'), 1000 * pollInterval)
    } catch (e) {
      console.error('fetchGasPrice', e)
      setTimeout(() => dispatch('fetchGasPrice'), 1000 * pollInterval)
    }
  },
  async estimateFees({ rootGetters }) {
    try {
      const { url } = rootGetters['settings/currentRpc']
      const web3 = this.$provider.getWeb3(url)
      const latestBlock = await web3.eth.getBlock('latest')

      if (!latestBlock.baseFeePerGas) {
        throw new Error('An error occurred while fetching current base fee, falling back')
      }

      const baseFee = toBN(latestBlock.baseFeePerGas)

      const potentialMaxFee = baseFee.mul(toBN(1125)).div(toBN(1000))

      const GWEI = (amount) => toBN(toWei(amount, 'gwei'))

      const fastPriorityFee = GWEI('4')
      const standardPriorityFee = GWEI('2.5')
      const lowPriorityFee = GWEI('1')

      return {
        instant: {
          baseFee,
          maxFeePerGas: potentialMaxFee.add(fastPriorityFee),
          maxPriorityFeePerGas: fastPriorityFee
        },
        fast: {
          baseFee,
          maxFeePerGas: potentialMaxFee.add(fastPriorityFee),
          maxPriorityFeePerGas: fastPriorityFee
        },
        standard: {
          baseFee,
          maxFeePerGas: potentialMaxFee.add(standardPriorityFee),
          maxPriorityFeePerGas: standardPriorityFee
        },
        low: {
          baseFee,
          maxFeePerGas: potentialMaxFee.add(lowPriorityFee),
          maxPriorityFeePerGas: lowPriorityFee
        }
      }
    } catch (err) {
      throw new Error(err.message)
    }
  },
  async getGasPrice({ state, getters }) {
    try {
      const gas = await getters.oracle.gasPrices(state.oracle)
      return gas
    } catch (err) {
      throw new Error(err.message)
    }
  },
  setDefault({ commit, rootGetters }) {
    const { gasPrices } = rootGetters['metamask/networkConfig']
    commit('SAVE_ORACLE_GAS_PRICES', gasPrices)
  },
  async fetchL1Fee({ commit, getters, dispatch, rootGetters }) {
    const netId = rootGetters['metamask/netId']
    const isOptimismConnected = rootGetters['application/isOptimismConnected']

    const oracleInstance = getters.ovmGasPriceOracleContract({ netId })

    if (isOptimismConnected && oracleInstance) {
      try {
        const gasLimit = rootGetters['application/withdrawGas']
        const tornadoProxyInstance = rootGetters['application/tornadoProxyContract']({ netId })

        const gasPrice = getters.fastGasPrice

        const tx = serialize({
          type: 0,
          gasLimit,
          gasPrice,
          chainId: netId,
          nonce: DUMMY_NONCE,
          data: DUMMY_WITHDRAW_DATA,
          to: tornadoProxyInstance._address
        })

        const l1Fee = await oracleInstance.methods.getL1Fee(tx).call()

        commit('SAVE_L1_FEE', l1Fee)
      } catch (err) {
        console.error('fetchL1Fee has error:', err.message)
      }
    }
  }
}
