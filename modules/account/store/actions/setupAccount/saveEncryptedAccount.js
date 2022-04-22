import { numberToHex } from 'web3-utils'
import { packEncryptedMessage } from '@/utils'

export async function saveEncryptedAccount({ getters, dispatch }, { from, encryptedData, callback }) {
  try {
    const contract = getters.echoContract

    const data = packEncryptedMessage(encryptedData)

    const callData = contract.getCallData(data)
    const gas = await contract.estimateGas({ from, data })

    const callParams = {
      method: 'eth_sendTransaction',
      params: {
        data: callData,
        to: contract.address,
        gas: numberToHex(gas + 10000)
      },
      watcherParams: {
        title: 'accountSaving',
        successTitle: 'accountSaved',
        onSuccess: callback
      },
      isSaving: false
    }

    await dispatch('metamask/sendTransaction', callParams, { root: true })
  } catch (err) {
    throw new Error(err.message)
  }
}
