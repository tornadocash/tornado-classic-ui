import { mapActions, mapGetters } from 'vuex'

export const controlMethods = {
  ...mapActions('notice', ['addNoticeWithInterval']),
  ...mapActions('encryptedNote', ['decryptNotes', 'removeAccount', 'enabledSaveFile', 'getRecoveryKey'])
}

export const controlComputed = {
  ...mapGetters('encryptedNote', ['isEnabledSaveFile', 'isSetupAccount'])
}

export const statisticComputed = {
  ...mapGetters('encryptedNote', ['statistic']),
  ...mapGetters('token', ['getSymbol'])
}

export const headerComputed = {
  ...mapGetters('encryptedNote', ['accounts'])
}
