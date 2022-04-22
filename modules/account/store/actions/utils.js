function createMutation({ commit, rootState }, { type, payload }) {
  const { netId } = rootState.metamask

  commit(type, { ...payload, netId })
}

function clearState({ dispatch }, { key }) {
  dispatch('createMutation', {
    type: 'CLEAR_STATE',
    payload: { key }
  })
}

export { clearState, createMutation }
