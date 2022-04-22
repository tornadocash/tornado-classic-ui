export function checkRecoveryKey({ getters, dispatch }) {
  const { encrypt: address } = getters.accounts
  const recoveryKey = this.$sessionStorage.getItem(address)

  if (!recoveryKey && !getters.encryptedPrivateKey) {
    dispatch('removeAccount')
  }
}
