import { initialUiState } from '../state/ui'

export const addresses = {
  SET_ADDRESSES(state, { netId, addresses }) {
    this._vm.$set(state.ui[`netId${netId}`], 'addresses', addresses)
  },
  REMOVE_ADDRESSES(state, { netId }) {
    this._vm.$set(state.ui[`netId${netId}`], 'addresses', initialUiState.addresses)
  }
}
