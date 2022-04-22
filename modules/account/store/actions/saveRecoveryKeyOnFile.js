import { saveAsFile } from '@/utils'

export function saveRecoveryKeyOnFile(_, { recoveryKey }) {
  try {
    const { address } = this.$provider.web3.eth.accounts.privateKeyToAccount(recoveryKey)

    const data = new Blob([`${recoveryKey}`], { type: 'text/plain;charset=utf-8' })

    saveAsFile(data, `backup-note-account-key-${address.slice(0, 10)}.txt`)
  } catch (err) {
    console.error('saveFile', err.message)
  }
}
