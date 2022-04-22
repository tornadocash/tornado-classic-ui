import { decryptNote } from './decryptNote'
import { decryptNotes, _encryptFormatTx, _checkCurrentTx } from './decryptNotes'

import { saveAccount } from './saveAccount'
import { removeAccount } from './removeAccount'
import { getRecoveryKey } from './getRecoveryKey'
import { enabledSaveFile } from './enabledSaveFile'
import { checkRecoveryKey } from './checkRecoveryKey'

import { setupAccount, saveEncryptedAccount } from './setupAccount'
import { recoverAccountFromChain, decryptAccount, getAccountFromAddress } from './recoverAccountFromChain'

import { checkExistAccount } from './checkExistAccount'
import { getEncryptedNote } from './getEncryptedNote'
import { getEncryptedAccount } from './getEncryptedAccount'
import { recoverAccountFromKey } from './recoverAccountFromKey'

import { redirectToAccount } from './redirectToAccount'
import { highlightNoteAccount } from './highlightNoteAccount'
import { saveRecoveryKeyOnFile } from './saveRecoveryKeyOnFile'

import { createMutation, clearState } from './utils'

export const actions = {
  // utils
  clearState,
  createMutation,
  // actions
  saveAccount,
  decryptNote,
  decryptNotes,
  setupAccount,
  removeAccount,
  decryptAccount,
  getRecoveryKey,
  enabledSaveFile,
  checkRecoveryKey,
  getEncryptedNote,
  redirectToAccount,
  checkExistAccount,
  getEncryptedAccount,
  highlightNoteAccount,
  saveEncryptedAccount,
  getAccountFromAddress,
  recoverAccountFromKey,
  recoverAccountFromChain,
  saveRecoveryKeyOnFile,
  // private actions
  _encryptFormatTx,
  _checkCurrentTx
}
