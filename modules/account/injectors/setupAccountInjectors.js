import { mapActions, mapGetters } from 'vuex'

export const setupAccountMethods = {
  ...mapActions('notice', ['addNoticeWithInterval']),
  ...mapActions('encryptedNote', ['clearState', 'setupAccount'])
}

export const setupAccountComputed = {
  ...mapGetters('encryptedNote', ['setupAccountRequest'])
}
