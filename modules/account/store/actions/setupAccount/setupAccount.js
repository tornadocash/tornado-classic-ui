export async function setupAccount({ dispatch, commit, getters, rootState }, { privateKey }) {
  try {
    dispatch('createMutation', { type: 'SET_DOMAIN_REQUEST', payload: { key: 'setupAccount' } })

    await dispatch('checkExistAccount')

    if (getters.isExistAccount) {
      throw new Error(this.app.i18n.t('haveAccountSetupWithWallet'))
    }

    dispatch('loading/enable', { message: this.app.i18n.t('pleaseConfirmInWallet') }, { root: true })

    const { ethAccount } = rootState.metamask
    const pubKey = await dispatch('metamask/getEncryptionPublicKey', {}, { root: true })
    const account = await dispatch('getEncryptedAccount', { privateKey, pubKey })

    const { address, publicKey, hexPrivateKey, encryptedData } = account

    const callback = () => {
      dispatch('createMutation', {
        type: 'CHECK_ACCOUNT',
        payload: { isExist: true }
      })

      dispatch('saveAccount', {
        address,
        backup: ethAccount,
        account: { publicKey, privateKey: hexPrivateKey }
      })

      dispatch(
        'notice/addNoticeWithInterval',
        {
          notice: {
            title: 'account.modals.setupAccount.successfulNotice',
            type: 'info'
          },
          interval: 10000
        },
        { root: true }
      )
    }

    await dispatch('saveEncryptedAccount', {
      encryptedData,
      from: ethAccount,
      callback
    })

    this.$sessionStorage.setItem(address, privateKey)

    dispatch('createMutation', { type: 'SET_DOMAIN_SUCCESS', payload: { key: 'setupAccount' } })
  } catch (err) {
    console.log('createMutation', err)
    dispatch('createMutation', {
      type: 'SET_DOMAIN_FAILED',
      payload: { key: 'setupAccount', errorMessage: err.message }
    })
  } finally {
    dispatch('loading/disable', {}, { root: true })
  }
}
