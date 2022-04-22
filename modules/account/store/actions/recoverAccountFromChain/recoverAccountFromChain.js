export async function recoverAccountFromChain({ dispatch, rootState }) {
  const { ethAccount } = rootState.metamask
  try {
    const { encryptedKey, backup } = await dispatch('getAccountFromAddress', ethAccount)
    const { address, publicKey, privateKey } = await dispatch('decryptAccount', encryptedKey)

    this.$sessionStorage.setItem(address, privateKey)

    dispatch('saveAccount', { account: { publicKey, privateKey: encryptedKey }, address, backup })
  } catch (err) {
    throw new Error(`Method recoverAccountFromChain has error: ${err.message}`)
  }
}
