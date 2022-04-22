import { isAddress } from 'web3-utils'
import { sliceAddress } from '@/utils'

export async function getRecoveryKey({ dispatch, getters, rootState }, enableLoader = true) {
  try {
    const { encrypt: address } = getters.accounts
    const recoverKey = this.$sessionStorage.getItem(address)

    if (recoverKey) {
      return recoverKey.data
    }

    const hasError = _checkBackupAccount({ rootState, dispatch, getters, i18n: this.app.i18n })

    if (hasError) {
      return
    }

    const encryptedPrivateKey = getters.encryptedPrivateKey
    dispatch('loading/enable', { message: this.app.i18n.t('decryptNote') }, { root: true })
    const privateKey = await dispatch('metamask/ethDecrypt', encryptedPrivateKey, { root: true })

    this.$sessionStorage.setItem(address, privateKey)

    return privateKey
  } catch (err) {
    const isRejected = err.message.includes('MetaMask Decryption: User denied message decryption.')

    const notice = {
      title: 'decryptFailed',
      type: 'danger'
    }

    if (isRejected) {
      notice.title = 'rejectedRequest'
      notice.description = rootState.metamask.walletName
    }

    dispatch('notice/addNoticeWithInterval', { notice, interval: 5000 }, { root: true })
  } finally {
    if (enableLoader) {
      dispatch('loading/disable', {}, { root: true })
    }
  }
}

function _checkBackupAccount(ctx) {
  const { ethAccount } = ctx.rootState.metamask

  if (!ethAccount) {
    const { backup, encrypt } = ctx.getters.accounts

    if (isAddress(backup)) {
      ctx.dispatch(
        'notice/addNoticeWithInterval',
        {
          notice: {
            untranslatedTitle: ctx.i18n.t('noteAccountKey', {
              address: sliceAddress(backup),
              noteAddress: sliceAddress(encrypt)
            }),
            type: 'danger'
          },
          interval: 10000
        },
        { root: true }
      )
      return 'error'
    }
  }
}
