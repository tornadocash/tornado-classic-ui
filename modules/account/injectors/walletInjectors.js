import { mapGetters, mapState, mapActions } from 'vuex'

export const walletComputed = {
  ...mapState('metamask', ['ethAccount']),
  ...mapGetters('metamask', ['netId', 'isLoggedIn'])
}

export const walletActions = {
  ...mapActions('metamask', ['onLogOut'])
}
