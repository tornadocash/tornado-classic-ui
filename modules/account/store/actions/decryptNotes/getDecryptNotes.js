export async function decryptNotes({ commit, dispatch }) {
  try {
    dispatch('loading/enable', { message: this.app.i18n.t('startDecryptingNotes') }, { root: true })

    const privateKey = await dispatch('getRecoveryKey', false)

    if (!privateKey) {
      return
    }

    const events = await dispatch('application/getEncryptedNotes', {}, { root: true })

    const { transactions, statistic, unSpent } = await dispatch('_encryptFormatTx', { events, privateKey })

    const checkedTxs = await dispatch('_checkCurrentTx', transactions)

    checkedTxs.forEach((tx) => {
      commit('txHashKeeper/SAVE_TX_HASH', tx, { root: true })
    })

    dispatch('createMutation', { type: 'SET_STATISTIC', payload: { statistic } })

    return {
      unSpent,
      spent: checkedTxs.length ? checkedTxs.length - unSpent : 0,
      all: events.length ? events.length - 1 : 0
    }
  } catch (err) {
    dispatch('createMutation', {
      type: 'SET_DOMAIN_FAILED',
      payload: { key: 'decryptNotes', errorMessage: err.message }
    })
  } finally {
    dispatch('loading/disable', {}, { root: true })
  }
}
