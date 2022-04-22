export const statistic = {
  SET_STATISTIC(state, { netId, statistic }) {
    this._vm.$set(state.ui[`netId${netId}`], 'statistic', statistic)
  },
  REMOVE_STATISTIC(state, { netId }) {
    this._vm.$set(state.ui[`netId${netId}`], 'statistic', {})
  }
}
