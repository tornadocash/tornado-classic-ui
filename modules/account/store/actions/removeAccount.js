export function removeAccount({ dispatch }) {
  try {
    dispatch('createMutation', { type: 'SET_DOMAIN_REQUEST', payload: { key: 'removeAccount' } })

    dispatch('createMutation', { type: 'REMOVE_ADDRESSES' })
    dispatch('createMutation', { type: 'REMOVE_KEY' })
    dispatch('createMutation', { type: 'ENABLED_SAVE_FILE', payload: { isEnabled: true } })
    dispatch('createMutation', { type: 'REMOVE_STATISTIC' })

    this.$sessionStorage.clear()

    dispatch('createMutation', { type: 'SET_DOMAIN_SUCCESS', payload: { key: 'removeAccount' } })
  } catch (err) {
    dispatch('createMutation', {
      type: 'SET_DOMAIN_FAILED',
      payload: { key: 'removeAccount', errorMessage: err.message }
    })
  }
}
