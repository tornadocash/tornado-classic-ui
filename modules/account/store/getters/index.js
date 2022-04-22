import { EchoContract } from './Contract'

import networkConfig from '@/networkConfig'

export const getters = {
  echoContract: (state, getters, rootState, rootGetters) => {
    const netId = rootState.metamask.netId
    const { url } = rootGetters['settings/currentRpc']
    const address = networkConfig[`netId${netId}`].echoContractAccount

    return new EchoContract({ rpcUrl: url, address })
  },
  // selectors
  selectUi: (state, getters, rootState) => (key) => {
    const { netId } = rootState.metamask
    return state.ui[`netId${netId}`][key]
  },
  selectDomain: (state, getters, rootState) => (key) => {
    const { netId } = rootState.metamask
    return state.domain[`netId${netId}`][key]
  },
  // ui store
  isExistAccount: (state, getters) => {
    return getters.selectUi('isExistAccount')
  },
  accounts: (state, getters) => {
    return getters.selectUi('addresses')
  },
  statistic: (state, getters) => {
    const data = getters.selectUi('statistic')

    if (Array.isArray(data)) {
      return data
    } else {
      return []
    }
  },
  noteAccountBalance: (state, getters, rootState, rootGetters) => {
    let balance = 0
    const nativeCurrency = rootGetters['metamask/nativeCurrency']

    getters.statistic.forEach(({ currency, amount }) => {
      if (currency === nativeCurrency) {
        balance += Number(amount)
      }
    })

    return balance
  },
  isSetupAccount: (state, getters) => {
    return Boolean(getters.selectUi('encryptedPublicKey'))
  },
  encryptedPublicKey: (state, getters) => {
    return getters.selectUi('encryptedPublicKey')
  },
  encryptedPrivateKey: (state, getters) => {
    return getters.selectUi('encryptedPrivateKey')
  },
  isEnabledSaveFile: (state, getters) => {
    return getters.selectUi('isEnabledSaveFile')
  },
  isHighlightedNoteAccount: (state, getters) => {
    return getters.selectUi('isHighlightedNoteAccount')
  },
  // domain store
  setupAccountRequest: (state, getters) => {
    return getters.selectDomain('setupAccount')
  },
  recoverAccountRequest: (state, getters) => {
    return getters.selectDomain('recoverAccountFromChain')
  },
  removeAccountRequest: (state, getters) => {
    return getters.selectDomain('removeAccount')
  },
  decryptNotesRequest: (state, getters) => {
    return getters.selectDomain('decryptNotes')
  },
  recoverAccountFromKeyRequest: (state, getters) => {
    return getters.selectDomain('recoverAccountFromKey')
  }
}
