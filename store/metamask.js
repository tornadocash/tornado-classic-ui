/* eslint-disable no-console */
import BN from 'bignumber.js'
import { hexToNumber, numberToHex } from 'web3-utils'
import { SnackbarProgrammatic as Snackbar, DialogProgrammatic as Dialog } from 'buefy'

import { PROVIDERS } from '@/constants'
import networkConfig from '@/networkConfig'
import { walletConnectConnector } from '@/services'

import SanctionsListAbi from '@/abis/SanctionsList.abi'

const { toChecksumAddress } = require('web3-utils')

const state = () => {
  return {
    netId: 1,
    walletName: '',
    ethBalance: '0',
    ethAccount: null,
    providerConfig: {},
    providerName: null,
    isInitialized: false,
    isReconnecting: false,
    mismatchNetwork: false
  }
}

const getters = {
  isWalletConnect(state) {
    return state.providerConfig.name === 'WalletConnect'
  },
  isPartialSupport(state) {
    return state.providerConfig.isPartialSupport
  },
  hasEthAccount(state) {
    return state.ethAccount !== null
  },
  mismatchNetwork(state) {
    return state.mismatchNetwork
  },
  netId(state) {
    return state.netId
  },
  networkName(state) {
    return networkConfig[`netId${state.netId}`].networkName
  },
  currency(state) {
    return networkConfig[`netId${state.netId}`].currencyName
  },
  nativeCurrency(state) {
    return networkConfig[`netId${state.netId}`].nativeCurrency
  },
  networkConfig(state) {
    const conf = networkConfig[`netId${state.netId}`]
    return conf || networkConfig.netId1
  },
  getEthereumProvider: (state, getters) => (netId) => {
    switch (state.providerName) {
      case 'walletConnect':
        return walletConnectConnector(netId || getters.netId)
      case 'metamask':
      case 'trustwallet':
      case 'imtoken':
      case 'alphawallet':
      case 'generic':
      default:
        if (window.ethereum) {
          return window.ethereum
        } else {
          throw new Error(this.app.i18n.t('networkDoesNotHaveEthereumProperty'))
        }
    }
  },
  isLoggedIn: (state, getters) => {
    return !!state.providerName && getters.hasEthAccount
  }
}

const mutations = {
  IDENTIFY(state, ethAccount) {
    state.ethAccount = ethAccount
  },
  SET_NET_ID(state, netId) {
    netId = parseInt(netId, 10)
    window.localStorage.setItem('netId', netId)

    state.netId = netId
  },
  SET_RECONNECTING(state, bool) {
    state.isReconnecting = bool
  },
  SET_MISMATCH_NETWORK(state, payload) {
    state.mismatchNetwork = payload
  },
  SAVE_BALANCE(state, ethBalance) {
    state.ethBalance = ethBalance
  },
  SET_WALLET_NAME(state, walletName) {
    state.walletName = walletName
  },
  SET_PROVIDER_NAME(state, providerName) {
    state.providerName = providerName
    state.providerConfig = PROVIDERS[providerName]
    window.localStorage.setItem('provider', providerName)
  },
  CLEAR_PROVIDER(state) {
    state.providerName = null
    state.providerConfig = {}
  },
  SET_INITIALIZED(state, initialized) {
    state.isInitialized = initialized
  }
}

const actions = {
  async initialize({ dispatch, commit, getters, rootState, rootGetters }, payload) {
    await dispatch('askPermission', payload)

    dispatch('governance/gov/checkActiveProposals', {}, { root: true })
  },
  onSetInitializeData({ commit, dispatch, state }, isMismatch) {
    if (isMismatch) {
      commit('IDENTIFY', null)
      commit('SET_INITIALIZED', false)
    } else {
      const providerName = window.localStorage.getItem('provider')

      if (providerName && !state.isInitialized) {
        dispatch('initialize', { providerName })
      }
    }

    commit('SET_MISMATCH_NETWORK', isMismatch)
  },
  async checkMismatchNetwork({ dispatch, commit, state, getters }, netId) {
    if (getters.isWalletConnect) {
      const { id } = this.$provider.config

      const isMismatch = Number(netId) !== Number(id)

      await dispatch('onSetInitializeData', isMismatch)
      return
    }
    if (!window.ethereum) {
      return
    }
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })
    const isMismatch = Number(netId) !== hexToNumber(chainId)

    await dispatch('onSetInitializeData', isMismatch)
  },
  async sendTransaction(
    { dispatch, state, rootGetters },
    { method, params, watcherParams, isAwait = true, isSaving = true, eipDisable = false }
  ) {
    try {
      const { ethAccount, netId } = state
      const gasParams = rootGetters['gasPrices/getGasParams']

      const callParams = {
        method,
        params: [
          {
            value: '0x00',
            from: ethAccount,
            ...params,
            ...gasParams
          }
        ]
      }

      dispatch('loading/showConfirmLoader', {}, { root: true })

      const txHash = await this.$provider.sendRequest(callParams)

      dispatch(
        'loading/changeText',
        { message: this.app.i18n.t('waitUntilTransactionIsMined') },
        { root: true }
      )

      const activeWatcher = () =>
        dispatch(
          'txHashKeeper/runTxWatcherWithNotifications',
          {
            ...watcherParams,
            txHash,
            isSaving,
            netId
          },
          { root: true }
        )

      if (isAwait) {
        await activeWatcher()
      } else {
        activeWatcher()
      }

      dispatch('loading/disable', {}, { root: true })

      return txHash
    } catch (err) {
      if (err.message.includes('EIP-1559')) {
        return await dispatch('sendTransaction', {
          method,
          params,
          watcherParams,
          isAwait,
          isSaving,
          eipDisable: true
        })
      } else {
        throw new Error(this.app.i18n.t('rejectedRequest', { description: state.walletName }))
      }
    } finally {
      dispatch('loading/disable', {}, { root: true })
    }
  },
  async getEncryptionPublicKey({ state }) {
    try {
      const { ethAccount } = state

      const callParams = {
        method: 'eth_getEncryptionPublicKey',
        params: [ethAccount]
      }

      const key = await this.$provider.sendRequest(callParams)
      return key
    } catch (err) {
      let errorMessage = 'decryptFailed'

      if (err.message.includes('Trezor')) {
        errorMessage = 'trezorNotSupported'
      } else if (err.message.includes('Ledger')) {
        errorMessage = 'ledgerNotSupported'
      }

      const isRejected = err.message.includes(
        'MetaMask EncryptionPublicKey: User denied message EncryptionPublicKey.'
      )

      if (isRejected) {
        throw new Error(this.app.i18n.t('rejectedRequest', { description: state.walletName }))
      }

      throw new Error(this.app.i18n.t(errorMessage))
    }
  },
  async ethDecrypt({ state }, hexData) {
    try {
      const { ethAccount } = state

      const callParams = {
        method: 'eth_decrypt',
        params: [hexData, ethAccount]
      }

      const encryptedData = await this.$provider.sendRequest(callParams)
      return encryptedData
    } catch (err) {
      throw new Error(`Method ethDecrypt has error: ${err.message}`)
    }
  },
  async onAccountsChanged({ dispatch, commit }, { newAccount }) {
    if (newAccount) {
      const account = toChecksumAddress(newAccount)
      commit('IDENTIFY', account)
      await dispatch('updateAccountBalance')
    } else {
      await dispatch('onLogOut')
    }
  },
  onLogOut({ commit, getters, dispatch }) {
    if (getters.isWalletConnect) {
      const mobileProvider = this.$provider.provider

      if (typeof mobileProvider.close === 'function') {
        mobileProvider.close()
      }
    }
    commit('IDENTIFY', null)
    dispatch('clearProvider')
    commit('SET_INITIALIZED', false)
  },
  async mobileWalletReconnect({ state, dispatch, commit, rootState }, { netId }) {
    try {
      commit('SET_RECONNECTING', true)
      const { providerName } = state
      const { enabled } = rootState.loading

      await dispatch('onLogOut')
      await dispatch('initialize', { providerName, chosenNetId: netId })

      if (enabled) {
        await dispatch('loading/disable', {}, { root: true })
      }
    } catch ({ message }) {
      throw new Error(`Mobile wallet reconnect error: ${message}`)
    } finally {
      commit('SET_RECONNECTING', false)
    }
  },
  async networkChangeHandler({ state, getters, commit, dispatch }, params) {
    try {
      if (getters.isWalletConnect) {
        dispatch('loading/disable', {}, { root: true })

        const networkName = networkConfig[`netId${params.netId}`].networkName

        const { result } = await Dialog.confirm({
          title: this.app.i18n.t('changeNetwork'),
          message: this.app.i18n.t('mobileWallet.reconnect.message', { networkName }),
          cancelText: this.app.i18n.t('cancelButton'),
          confirmText: this.app.i18n.t('mobileWallet.reconnect.action')
        })

        if (result) {
          await dispatch('mobileWalletReconnect', params)
          this.$provider._onNetworkChanged({ id: params.netId })
        }
      } else {
        if (state.isInitialized) {
          await dispatch('switchNetwork', params)
        }
        await dispatch('onNetworkChanged', params)
      }
    } catch (err) {
      console.error('networkChangeHandler', err.message)
    }
  },
  async checkIsSanctioned({ rootGetters }, { address }) {
    const ethProvider = rootGetters['relayer/ethProvider']
    const contract = new ethProvider.eth.Contract(
      SanctionsListAbi,
      '0x40C57923924B5c5c5455c48D93317139ADDaC8fb'
    )

    const isSanctioned = await contract.methods.isSanctioned(address).call()

    if (isSanctioned) {
      window.onbeforeunload = null
      window.location = 'https://twitter.com/TornadoCash/status/1514904975037669386'
    }
  },
  async onNetworkChanged({ state, getters, commit, dispatch }, { netId }) {
    dispatch('checkMismatchNetwork', netId)

    if (netId !== 'loading' && Number(state.netId) !== Number(netId)) {
      try {
        if (!networkConfig[`netId${netId}`]) {
          dispatch('clearProvider')

          Snackbar.open({
            message: this.app.i18n.t('currentNetworkIsNotSupported'),
            type: 'is-primary',
            position: 'is-top',
            actionText: 'OK',
            indefinite: true
          })
          throw new Error(this.app.i18n.t('currentNetworkIsNotSupported'))
        }

        commit('SET_NET_ID', netId)
        await dispatch('application/setNativeCurrency', { netId }, { root: true })

        // TODO what if all rpc failed
        await dispatch('settings/checkCurrentRpc', {}, { root: true })

        dispatch('application/updateSelectEvents', {}, { root: true })

        if (getters.isLoggedIn) {
          await dispatch('updateAccountBalance')
        }
      } catch (e) {
        throw new Error(e.message)
      }
    }
  },
  async updateAccountBalance({ state, commit }, account = '') {
    try {
      const address = account || state.ethAccount
      if (!address) {
        return 0
      }

      const balance = await this.$provider.getBalance({ address })
      commit('SAVE_BALANCE', balance)
      return balance
    } catch (err) {
      console.error(`updateAccountBalance has error ${err.message}`)
    }
  },
  clearProvider({ commit, state }) {
    if (state.providerConfig.storageName) {
      window.localStorage.removeItem(state.providerConfig.storageName)
    }

    commit('CLEAR_PROVIDER')

    window.localStorage.removeItem('provider')
    window.localStorage.removeItem('network')
  },
  async askPermission(
    { commit, dispatch, getters, rootGetters, state, rootState },
    { providerName, chosenNetId }
  ) {
    commit('SET_PROVIDER_NAME', providerName)

    const { name, listener } = state.providerConfig

    commit('SET_WALLET_NAME', name)

    try {
      const provider = await getters.getEthereumProvider(chosenNetId)

      if (providerName === 'walletConnect') {
        await dispatch(listener, { provider })
      }
      const address = await this.$provider.initProvider(provider, {})

      if (!address) {
        throw new Error('lockedMetamask')
      }

      await dispatch('checkIsSanctioned', { address })

      commit('IDENTIFY', address)

      const netId = await dispatch('checkNetworkVersion')

      await dispatch('onNetworkChanged', { netId })
      commit('SET_INITIALIZED', true)

      const { url } = rootGetters['settings/currentRpc']
      this.$provider.initWeb3(url)

      await dispatch('updateAccountBalance', address)

      if (getters.isWalletConnect) {
        if (provider.wc.peerMeta) {
          commit('SET_WALLET_NAME', provider.wc.peerMeta.name)
        }
      }

      this.$provider.on({
        method: 'chainChanged',
        callback: () => {
          dispatch('onNetworkChanged', { netId })
        }
      })

      this.$provider.on({
        method: 'accountsChanged',
        callback: ([newAccount]) => {
          dispatch('onAccountsChanged', { newAccount })
        }
      })

      return { netId, ethAccount: address }
    } catch (err) {
      if (providerName === 'walletConnect') {
        const mobileProvider = this.$provider.provider

        if (typeof mobileProvider.disconnect === 'function') {
          mobileProvider.disconnect()
        }
        await dispatch('onLogOut')
      }
      throw new Error(`method askPermission has error: ${err.message}`)
    }
  },
  walletConnectSocketListener({ state, commit, dispatch, getters, rootState }, { provider }) {
    const { enabled } = rootState.loading

    try {
      provider.wc.on('disconnect', (error, payload) => {
        if (state.isReconnecting) {
          console.warn('Provider reconnect payload', { payload, error, isReconnecting: state.isReconnecting })

          if (enabled) {
            dispatch('loading/disable', {}, { root: true })
          }
          commit('SET_RECONNECTING', false)
          return
        }

        const prevConnection = localStorage.getItem('walletconnectTimeStamp')

        const isPrevConnection = new BN(Date.now()).minus(prevConnection).isGreaterThanOrEqualTo(5000)

        if (isPrevConnection) {
          console.warn('Provider disconnect payload', {
            payload,
            error,
            isReconnecting: state.isReconnecting
          })

          dispatch('onLogOut')
        }

        if (enabled) {
          dispatch('loading/disable', {}, { root: true })
        }
      })
    } catch (err) {
      console.error('WalletConnect listeners error: ', err)
    }
  },
  async switchNetwork({ dispatch }, { netId }) {
    try {
      await this.$provider.sendRequest({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: numberToHex(netId) }]
      })
    } catch (err) {
      // This error indicates that the chain has not been added to MetaMask.
      if (err.message.includes('wallet_addEthereumChain')) {
        return dispatch('addNetwork', { netId })
      }

      throw new Error(err.message)
    }
  },
  async addNetwork(_, { netId }) {
    const METAMASK_LIST = {
      56: {
        chainId: '0x38',
        chainName: 'Binance Smart Chain Mainnet',
        rpcUrls: ['https://bsc-dataseed1.ninicoin.io'],
        nativeCurrency: {
          name: 'Binance Chain Native Token',
          symbol: 'BNB',
          decimals: 18
        },
        blockExplorerUrls: ['https://bscscan.com']
      },
      10: {
        chainId: '0xa',
        chainName: 'Optimism',
        rpcUrls: ['https://mainnet.optimism.io/'],
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18
        },
        blockExplorerUrls: ['https://optimistic.etherscan.io']
      },
      100: {
        chainId: '0x64',
        chainName: 'Gnosis',
        rpcUrls: ['https://rpc.gnosischain.com'],
        nativeCurrency: {
          name: 'xDAI',
          symbol: 'xDAI',
          decimals: 18
        },
        blockExplorerUrls: ['https://blockscout.com/xdai/mainnet']
      },
      137: {
        chainId: '0x89',
        chainName: 'Polygon Mainnet',
        rpcUrls: ['https://rpc-mainnet.maticvigil.com'],
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18
        },
        blockExplorerUrls: ['https://polygonscan.com']
      },
      42161: {
        chainId: '0xA4B1',
        chainName: 'Arbitrum One',
        rpcUrls: ['https://arb1.arbitrum.io/rpc'],
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18
        },
        blockExplorerUrls: ['https://arbiscan.io']
      },
      43114: {
        chainId: '0xA86A',
        chainName: 'Avalanche C-Chain',
        rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
        nativeCurrency: {
          name: 'Avalanche',
          symbol: 'AVAX',
          decimals: 18
        },
        blockExplorerUrls: ['https://snowtrace.io']
      }
    }

    if (METAMASK_LIST[netId]) {
      await this.$provider.sendRequest({
        method: 'wallet_addEthereumChain',
        params: [METAMASK_LIST[netId]]
      })
    }
  },
  async checkNetworkVersion() {
    try {
      const id = Number(
        await this.$provider.sendRequest({
          method: 'eth_chainId',
          params: []
        })
      )

      return id
    } catch (err) {
      throw new Error(err.message)
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
