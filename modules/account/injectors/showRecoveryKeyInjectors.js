import { mapActions } from 'vuex'

export const showRecoveryKeyMethods = {
  ...mapActions('notice', ['addNoticeWithInterval'])
}
