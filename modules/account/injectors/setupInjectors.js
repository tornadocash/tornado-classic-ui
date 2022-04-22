import { mapActions, mapGetters, mapState } from 'vuex'

export const setupMethods = {
  ...mapActions('loading', ['enable', 'disable']),
  ...mapActions('notice', ['addNoticeWithInterval']),
  ...mapActions('encryptedNote', [
    'clearState',
    'decryptNotes',
    'setupAccount',
    'recoverAccountFromKey',
    'saveRecoveryKeyOnFile',
    'recoverAccountFromChain'
  ])
}

export const setupComputed = {
  ...mapState('metamask', ['isInitialized', 'providerName']),
  ...mapGetters('metamask', ['isLoggedIn', 'isPartialSupport']),
  ...mapGetters('encryptedNote', ['isExistAccount', 'setupAccountRequest'])
}
