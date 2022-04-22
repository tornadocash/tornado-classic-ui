import { encrypt } from 'eth-sig-util'

import { packEncryptedMessage } from '@/utils'

export function getEncryptedNote({ getters }, { data }) {
  try {
    const encryptedPublicKey = getters.encryptedPublicKey

    if (!encryptedPublicKey) {
      return
    }

    const encryptedData = encrypt(encryptedPublicKey, { data }, 'x25519-xsalsa20-poly1305')

    return packEncryptedMessage(encryptedData)
  } catch (err) {
    throw new Error(`Method getEncryptedNote has error: ${err.message}`)
  }
}
