export function enabledSaveFile({ dispatch, getters }) {
  dispatch('createMutation', {
    type: 'ENABLED_SAVE_FILE',
    payload: { isEnabled: !getters.isEnabledSaveFile }
  })
}
