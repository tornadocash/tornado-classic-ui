import { getEncryptionPublicKey } from 'eth-sig-util'

export async function decryptAccount({ dispatch }, encryptedAccount) {
  try {
    const privateKey = await dispatch('metamask/ethDecrypt', encryptedAccount, { root: true })
    const publicKey = getEncryptionPublicKey(privateKey)

    const { address } = await this.$provider.web3.eth.accounts.privateKeyToAccount(privateKey)

    return { address, publicKey, privateKey }
  } catch (err) {
    throw new Error(`Method decryptAccount has error: ${err.message}`)
  }
}
