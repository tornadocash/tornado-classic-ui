export const encryptedAccount = {
  SET_ENCRYPTED_ACCOUNT(state, { netId, publicKey, privateKey }) {
    this._vm.$set(state.ui[`netId${netId}`], 'encryptedPublicKey', publicKey)
    this._vm.$set(state.ui[`netId${netId}`], 'encryptedPrivateKey', privateKey)
  },
  CHECK_ACCOUNT(state, { netId, isExist }) {
    this._vm.$set(state.ui[`netId${netId}`], 'isExistAccount', isExist)
  },
  REMOVE_KEY(state, { netId }) {
    this._vm.$set(state.ui[`netId${netId}`], 'encryptedPublicKey', '')
    this._vm.$set(state.ui[`netId${netId}`], 'encryptedPrivateKey', '')
  },
  SET_HIGHLIGHT_NOTE_ACCOUNT(state, { netId, isHighlighted }) {
    this._vm.$set(state.ui[`netId${netId}`], 'isHighlightedNoteAccount', isHighlighted)
  }
}
