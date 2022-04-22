import crypto from 'crypto'
import { BN, toBN } from 'web3-utils'

import { pedersen } from '@/services'

const CUT_LENGTH = 31

export function parseNote(note) {
  const [, currency, amount, netId, hexNote] = note.split('-')

  return {
    ...parseHexNote(hexNote),
    netId,
    amount,
    currency
  }
}

export function parseHexNote(hexNote) {
  const buffNote = Buffer.from(hexNote.slice(2), 'hex')

  const commitment = buffPedersenHash(buffNote)

  const nullifierBuff = buffNote.slice(0, CUT_LENGTH)
  const nullifierHash = BigInt(buffPedersenHash(nullifierBuff))
  const nullifier = BigInt(leInt2Buff(buffNote.slice(0, CUT_LENGTH)))

  const secret = BigInt(leInt2Buff(buffNote.slice(CUT_LENGTH, CUT_LENGTH * 2)))

  return {
    secret,
    nullifier,
    commitment,
    nullifierBuff,
    nullifierHash,
    commitmentHex: toFixedHex(commitment),
    nullifierHex: toFixedHex(nullifierHash)
  }
}

export function leInt2Buff(value) {
  return new BN(value, 16, 'le')
}

export function randomBN(nbytes = 31) {
  return toBN(leInt2Buff(crypto.randomBytes(nbytes)).toString())
}

export function buffPedersenHash(buffer) {
  const [hash] = pedersen.unpackPoint(buffer)
  return pedersen.toStringBuffer(hash)
}

export function toFixedHex(value, length = 32) {
  const isBuffer = value instanceof Buffer

  const str = isBuffer ? value.toString('hex') : BigInt(value).toString(16)
  return '0x' + str.padStart(length * 2, '0')
}

export const isEmptyArray = (arr) => !Array.isArray(arr) || !arr.length

export function packEncryptedMessage(encryptedMessage) {
  const nonceBuf = Buffer.from(encryptedMessage.nonce, 'base64')
  const ephemPublicKeyBuf = Buffer.from(encryptedMessage.ephemPublicKey, 'base64')
  const ciphertextBuf = Buffer.from(encryptedMessage.ciphertext, 'base64')
  const messageBuff = Buffer.concat([
    Buffer.alloc(24 - nonceBuf.length),
    nonceBuf,
    Buffer.alloc(32 - ephemPublicKeyBuf.length),
    ephemPublicKeyBuf,
    ciphertextBuf
  ])
  return '0x' + messageBuff.toString('hex')
}

export function unpackEncryptedMessage(encryptedMessage) {
  if (encryptedMessage.slice(0, 2) === '0x') {
    encryptedMessage = encryptedMessage.slice(2)
  }
  const messageBuff = Buffer.from(encryptedMessage, 'hex')
  const nonceBuf = messageBuff.slice(0, 24)
  const ephemPublicKeyBuf = messageBuff.slice(24, 56)
  const ciphertextBuf = messageBuff.slice(56)
  return {
    version: 'x25519-xsalsa20-poly1305',
    nonce: nonceBuf.toString('base64'),
    ephemPublicKey: ephemPublicKeyBuf.toString('base64'),
    ciphertext: ciphertextBuf.toString('base64')
  }
}

export function checkCommitments(events = []) {
  events.forEach(({ leafIndex }, i) => {
    // TODO reload events, need for if infura provider missing events
    if (leafIndex !== i) {
      console.error(`Missing deposit event for deposit #${i}`)
      throw new Error(window.$nuxt.$t('failedToFetchAllDepositEvents'))
    }
  })
}
