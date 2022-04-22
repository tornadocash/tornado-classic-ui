/* eslint-disable no-console */
import { toBN, toChecksumAddress } from 'web3-utils'

import networkConfig from '@/networkConfig'
import offchainOracleABI from '@/abis/OffchainOracle.abi.json'

const offchainOracleAddress = '0x07D91f5fb9Bf7798734C3f606dB065549F6893bb'

const TOKENS = {
  torn: {
    tokenAddress: '0x77777FeDdddFfC19Ff86DB637967013e6C6A116C',
    symbol: 'TORN',
    decimals: 18
  }
}

export const state = () => {
  return {
    prices: {
      dai: '593970928097706',
      cdai: '12623454013395',
      usdc: '593319851383838',
      usdt: '592852719537467',
      torn: '85362951428474830',
      wbtc: '32269526951862905063'
    }
  }
}

export const getters = {
  tokenRate: (state, getters, rootState, rootGetters) => {
    return state.prices[rootState.application.selectedStatistic.currency]
  },
  getArgsForOracle: (state, getters, rootState, rootGetters) => {
    const tokens = {
      ...networkConfig.netId1.tokens,
      ...TOKENS
    }
    const tokenAddresses = []
    const oneUintAmount = []
    const currencyLookup = {}
    Object.entries(tokens).map(([currency, data]) => {
      if (currency !== 'eth') {
        tokenAddresses.push(data.tokenAddress)
        oneUintAmount.push(
          toBN('10')
            .pow(toBN(data.decimals.toString()))
            .toString()
        )
        currencyLookup[data.tokenAddress] = currency
      }
    })
    return { tokenAddresses, oneUintAmount, currencyLookup }
  },
  getTokenPrice: (state, getters, rootState, rootGetters) => (currency) => {
    return state.prices[currency]
  },
  isPriceWatcherDisabled: (state, getters, rootState, rootGetters) => {
    const nativeCurrency = rootGetters['metamask/nativeCurrency']
    const tokens = Object.keys(rootGetters['metamask/networkConfig'].tokens)
    return tokens.includes(nativeCurrency) && tokens.length === 1
  }
}

export const mutations = {
  SAVE_TOKEN_PRICES(state, prices) {
    state.prices = {
      ...state.prices,
      ...prices
    }
  }
}

export const actions = {
  async fetchTokenPrice({ getters, commit, dispatch, rootState }) {
    if (getters.isPriceWatcherDisabled) {
      return
    }

    try {
      const web3 = this.$provider.getWeb3(rootState.settings.netId1.rpc.url)
      const offchainOracle = new web3.eth.Contract(offchainOracleABI, offchainOracleAddress)
      const { tokenAddresses, oneUintAmount, currencyLookup } = getters.getArgsForOracle

      const prices = {}
      for (let i = 0; i < tokenAddresses.length; i++) {
        try {
          const isWrap =
            toChecksumAddress(tokenAddresses[i]) ===
            toChecksumAddress('0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643')

          const price = await offchainOracle.methods.getRateToEth(tokenAddresses[i], isWrap).call()
          const numerator = toBN(oneUintAmount[i])
          const denominator = toBN(10).pow(toBN(18)) // eth decimals
          const priceFormatted = toBN(price)
            .mul(numerator)
            .div(denominator)

          prices[currencyLookup[tokenAddresses[i]]] = priceFormatted.toString()
        } catch (e) {
          console.error('cant get price of ', tokenAddresses[i])
        }
      }

      console.log('prices', prices)
      commit('SAVE_TOKEN_PRICES', prices)

      setTimeout(() => dispatch('fetchTokenPrice'), 1000 * 30)
    } catch (e) {
      console.error(e)
      setTimeout(() => dispatch('fetchTokenPrice'), 1000 * 30)
    }
  }
}
