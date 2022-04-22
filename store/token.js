/* eslint-disable no-console */
/* eslint-disable import/order */
import Web3 from 'web3'
import networkConfig from '@/networkConfig'
import ERC20ABI from '@/abis/ERC20.abi.json'
const { numberToHex, toBN, toWei } = require('web3-utils')
const BN = require('bn.js')
const zero = new BN(0)
const negative1 = new BN(-1)

export const state = () => {
  return {
    approvalAmount: 'unlimited',
    allowance: '',
    balance: ''
  }
}

export const getters = {
  tokenContract: (state, getters, rootState, rootGetters) => ({ currency, netId }) => {
    const config = networkConfig[`netId${netId}`]
    const { url } = rootState.settings[`netId${netId}`].rpc
    const address = config.tokens[currency].tokenAddress
    const web3 = new Web3(url)
    return new web3.eth.Contract(ERC20ABI, address)
  },
  // similar to fromWei from web3
  toDecimals: (state, getters, rootState, rootGetters) => (value, decimals, fixed) => {
    const { currency } = rootState.application.selectedStatistic
    decimals = decimals || rootGetters['metamask/networkConfig'].tokens[currency].decimals
    fixed = fixed || 2

    value = new BN(value)
    const negative = value.lt(zero)
    const base = new BN('10').pow(new BN(decimals))
    const baseLength = base.toString(10).length - 1 || 1

    if (negative) {
      value = value.mul(negative1)
    }

    let fraction = value.mod(base).toString(10)
    while (fraction.length < baseLength) {
      fraction = `0${fraction}`
    }
    fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1]
    const whole = value.div(base).toString(10)

    if (fixed && fraction !== '0') {
      fraction = fraction.slice(0, fixed)
    }
    value = `${whole}${fraction === '0' ? '' : `.${fraction}`}`

    if (negative) {
      value = `-${value}`
    }

    return value
  },
  // similar to toWei from web3
  fromDecimals: (state, getters, rootState, rootGetters) => (value, decimals) => {
    const { currency } = rootState.application.selectedStatistic
    decimals = decimals || rootGetters['metamask/networkConfig'].tokens[currency].decimals
    value = value.toString()
    let ether = value.toString()
    const base = new BN('10').pow(new BN(decimals))
    const baseLength = base.toString(10).length - 1 || 1

    const negative = ether.substring(0, 1) === '-'
    if (negative) {
      ether = ether.substring(1)
    }

    if (ether === '.') {
      throw new Error(this.app.i18n.t('unitInvalidValue', { value }))
    }

    // Split it into a whole and fractional part
    const comps = ether.split('.')
    if (comps.length > 2) {
      throw new Error(this.app.i18n.t('tooManyDecimalPoints', { value }))
    }

    let whole = comps[0]
    let fraction = comps[1]

    if (!whole) {
      whole = '0'
    }
    if (!fraction) {
      fraction = '0'
    }
    if (fraction.length > baseLength) {
      throw new Error(this.app.i18n.t('tooManyDecimalPlaces', { value }))
    }

    while (fraction.length < baseLength) {
      fraction += '0'
    }

    whole = new BN(whole)
    fraction = new BN(fraction)
    let wei = whole.mul(base).add(fraction)

    if (negative) {
      wei = wei.mul(negative)
    }

    return new BN(wei.toString(10), 10)
  },
  isSufficientAllowance: (state, getters, rootState, rootGetters) => {
    const { currency, amount } = rootState.application.selectedInstance
    const { decimals } = rootGetters['metamask/networkConfig'].tokens[currency]
    return toBN(state.allowance).gte(toBN(getters.fromDecimals(amount, decimals)))
  },
  isSufficientBalance: (state, getters, rootState, rootGetters) => {
    const ethBalance = rootState.metamask.ethBalance
    const { currency, amount } = rootState.application.selectedInstance
    const { decimals } = rootGetters['metamask/networkConfig'].tokens[currency]
    const nativeCurrency = rootGetters['metamask/nativeCurrency']
    if (currency === nativeCurrency) {
      return toBN(ethBalance).gte(toBN(toWei(amount.toString())))
    } else {
      return toBN(state.balance).gte(toBN(getters.fromDecimals(amount, decimals)))
    }
  },
  getSymbol: (state, getters, rootState, rootGetters) => (currency) => {
    const tokens = rootGetters['metamask/networkConfig'].tokens
    if (tokens[currency]) {
      return tokens[currency].symbol
    }
    return currency.toUpperCase()
  }
}

export const mutations = {
  SET_APPROVAL_AMOUNT(state, { approvalAmount }) {
    state.approvalAmount = approvalAmount
  },
  SAVE_ALLOWANCE(state, { allowance }) {
    this._vm.$set(state, 'allowance', allowance)
  },
  SAVE_BALANCE(state, { balance }) {
    this._vm.$set(state, 'balance', balance)
  }
}

export const actions = {
  async approve({ rootState, getters, dispatch, rootGetters, state }) {
    try {
      const netId = rootGetters['metamask/netId']
      const { currency } = rootState.application.selectedInstance
      const { decimals } = rootGetters['metamask/networkConfig'].tokens[currency]
      const tokenInstance = getters.tokenContract({ currency, netId })
      const tornadoProxy = rootGetters['application/tornadoProxyContract']({ netId })

      const { ethAccount } = rootState.metamask
      const amountToApprove =
        state.approvalAmount === 'unlimited'
          ? toBN('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
          : toBN(getters.fromDecimals(state.approvalAmount, decimals))
      const data = tokenInstance.methods
        .approve(tornadoProxy._address, amountToApprove.toString())
        .encodeABI()
      const gas = await tokenInstance.methods
        .approve(tornadoProxy._address, amountToApprove.toString())
        .estimateGas({
          from: ethAccount
        })

      const callParams = {
        method: 'eth_sendTransaction',
        params: {
          to: tokenInstance._address,
          gas: numberToHex(gas + 30000),
          data
        },
        watcherParams: {
          title: 'approve',
          successTitle: 'approved'
        },
        isSaving: false
      }

      await dispatch('metamask/sendTransaction', callParams, { root: true })
    } catch (e) {
      console.error('approve action', e)
      throw new Error(e.message)
    }
  },
  async fetchTokenAllowance({ getters, rootGetters, commit, rootState }) {
    const netId = rootGetters['metamask/netId']
    const { currency } = rootState.application.selectedInstance
    const { ethAccount } = rootState.metamask
    try {
      const tornadoInstance = rootGetters['application/tornadoProxyContract']({ netId })
      const nativeCurrency = rootGetters['metamask/nativeCurrency']
      if (currency !== nativeCurrency && ethAccount) {
        const tokenInstance = getters.tokenContract({ currency, netId })
        const allowance = await tokenInstance.methods.allowance(ethAccount, tornadoInstance._address).call()
        commit('SAVE_ALLOWANCE', { allowance })
      }
    } catch (e) {
      console.error('fetchTokenAllowance', e.message)
    }
  },
  async fetchTokenBalance({ state, getters, rootGetters, commit, rootState }) {
    try {
      const netId = rootGetters['metamask/netId']
      const { currency } = rootState.application.selectedInstance
      const { ethAccount } = rootState.metamask
      const nativeCurrency = rootGetters['metamask/nativeCurrency']
      if (currency !== nativeCurrency && ethAccount) {
        const tokenInstance = getters.tokenContract({ currency, netId })
        const balance = await tokenInstance.methods.balanceOf(ethAccount).call()
        commit('SAVE_BALANCE', { balance })
      }
    } catch (e) {
      console.error('fetchTokenBalance', e.message)
    }
  }
}
