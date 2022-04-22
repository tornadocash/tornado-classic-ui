import { decrypt } from 'eth-sig-util'

import { unpackEncryptedMessage } from '@/utils'

export async function decryptNote({ dispatch }, encryptedNote) {
  try {
    const recoveryKey = await dispatch('getRecoveryKey')

    const unpackedMessage = unpackEncryptedMessage(encryptedNote)
    const [, note] = decrypt(unpackedMessage, recoveryKey).split('-')

    return note
  } catch (err) {
    console.warn(`Method decryptNote has error: ${err.message}`)
  }
}
