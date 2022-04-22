export const state = () => {
  return {
    message: '',
    enabled: false,
    type: null
  }
}

export const getters = {}

export const mutations = {
  ENABLE(state, { message, type }) {
    state.message = message
    state.enabled = true
    state.type = type
  },
  DISABLE(state) {
    state.message = ''
    state.enabled = false
    state.type = null
  }
}

export const actions = {
  enable({ commit }, { message = this.app.i18n.t('loading') }) {
    commit('ENABLE', { message })
  },
  changeText({ commit }, { message, type }) {
    commit('ENABLE', { message, type })
  },
  disable({ commit }) {
    commit('DISABLE')
  },
  showConfirmLoader({ dispatch, rootState }) {
    dispatch('changeText', {
      message: this.app.i18n.t('pleaseConfirmTransactionInWallet', {
        wallet: rootState.metamask.walletName
      }),
      type: 'approve'
    })
  }
}
