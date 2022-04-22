import { getEncryptionPublicKey } from 'eth-sig-util'

export function recoverAccountFromKey({ dispatch }, { recoveryKey }) {
  try {
    dispatch('createMutation', { type: 'SET_DOMAIN_REQUEST', payload: { key: 'recoverAccountFromKey' } })

    const publicKey = getEncryptionPublicKey(recoveryKey)

    const { address } = this.$provider.web3.eth.accounts.privateKeyToAccount(recoveryKey)
    const keyWithOutPrefix = recoveryKey.slice(0, 2) === '0x' ? recoveryKey.replace('0x', '') : recoveryKey

    this.$sessionStorage.setItem(address, keyWithOutPrefix)

    dispatch('saveAccount', { account: { publicKey, privateKey: '' }, address })

    dispatch('createMutation', { type: 'SET_DOMAIN_SUCCESS', payload: { key: 'recoverAccountFromKey' } })
  } catch (err) {
    dispatch('createMutation', {
      type: 'SET_DOMAIN_FAILED',
      payload: { key: 'recoverAccountFromKey', errorMessage: err.message }
    })
  }
}
