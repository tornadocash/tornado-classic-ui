export const enabledSaveFile = {
  ENABLED_SAVE_FILE(state, { netId, isEnabled }) {
    this._vm.$set(state.ui[`netId${netId}`], 'isEnabledSaveFile', isEnabled)
  }
}
