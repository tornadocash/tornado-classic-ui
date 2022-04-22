import { mapGetters, mapActions } from 'vuex'

export const indicatorMethods = {
  ...mapActions('encryptedNote', ['highlightNoteAccount', 'redirectToAccount'])
}

export const indicatorComputed = {
  ...mapGetters('metamask', ['currency']),
  ...mapGetters('encryptedNote', ['accounts', 'isSetupAccount', 'noteAccountBalance'])
}
