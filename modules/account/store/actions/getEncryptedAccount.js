import { encrypt, getEncryptionPublicKey } from 'eth-sig-util'

export function getEncryptedAccount(_, { privateKey, pubKey }) {
  try {
    const { address } = this.$provider.web3.eth.accounts.privateKeyToAccount(privateKey)
    const keyWithOutPrefix = privateKey.slice(0, 2) === '0x' ? privateKey.replace('0x', '') : privateKey

    const publicKey = getEncryptionPublicKey(keyWithOutPrefix)

    const encryptedData = encrypt(pubKey, { data: keyWithOutPrefix }, 'x25519-xsalsa20-poly1305')
    const hexPrivateKey = Buffer.from(JSON.stringify(encryptedData)).toString('hex')

    return {
      address,
      publicKey,
      hexPrivateKey,
      encryptedData
    }
  } catch (err) {
    throw new Error(`Method getEncryptedAccount has error: ${err.message}`)
  }
}
