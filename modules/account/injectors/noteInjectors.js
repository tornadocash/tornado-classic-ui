import { mapActions, mapGetters, mapState } from 'vuex'

export const noteMethods = {
  ...mapActions('encryptedNote', ['checkExistAccount', 'highlightNoteAccount'])
}

export const noteComputed = {
  ...mapGetters('encryptedNote', ['isSetupAccount']),
  ...mapState('metamask', ['isInitialized', 'netId']),
  ...mapGetters('encryptedNote', ['isHighlightedNoteAccount'])
}
