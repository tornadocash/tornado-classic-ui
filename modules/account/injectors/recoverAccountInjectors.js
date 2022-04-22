import { mapActions, mapGetters } from 'vuex'

export const recoverAccountMethods = mapActions('encryptedNote', ['clearState', 'recoverAccountFromKey'])

export const recoverAccountComputed = {
  ...mapGetters('encryptedNote', ['recoverAccountFromKeyRequest'])
}
