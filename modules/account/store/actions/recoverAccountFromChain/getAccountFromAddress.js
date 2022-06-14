import { getEventsFromBlockPart } from '../utils'
import { unpackEncryptedMessage } from '@/utils'

export async function getAccountFromAddress({ getters, rootGetters }, address) {
  try {
    const netId = rootGetters['metamask/netId']

    const rpc = rootGetters['settings/currentRpc']
    const web3 = this.$provider.getWeb3(rpc.url)
    const currentBlockNumber = await web3.eth.getBlockNumber()

    const events = await getEventsFromBlockPart({
      netId,
      address,
      currentBlockNumber,
      echoContract: getters.echoContract
    })

    const [lastEvent] = events.slice(-1)

    if (!lastEvent) {
      throw new Error(`Please setup account, account doesn't exist for this address`)
    }

    const encryptedMessage = unpackEncryptedMessage(lastEvent.encryptedAccount)
    const encryptedKey = Buffer.from(JSON.stringify(encryptedMessage)).toString('hex')

    return {
      encryptedKey,
      backup: lastEvent.address
    }
  } catch (err) {
    throw new Error(`Method getAccountFromAddress has error: ${err.message}`)
  }
}
