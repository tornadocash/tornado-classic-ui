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
      currentBlockNumber,
      address,
      echoContract: getters.echoContract
    })

    const [lastEvent] = events.slice(-1)

    if (!lastEvent) {
      throw new Error(`Please setup account, account doesn't exist for this address`)
    }

    const data = lastEvent.encryptedAccount ? lastEvent.encryptedAccount : lastEvent.returnValues.data
    const backup = lastEvent.address ? lastEvent.address : lastEvent.returnValues.who

    const encryptedMessage = unpackEncryptedMessage(data)
    const encryptedKey = Buffer.from(JSON.stringify(encryptedMessage)).toString('hex')

    return {
      backup,
      encryptedKey
    }
  } catch (err) {
    throw new Error(`Method getAccountFromAddress has error: ${err.message}`)
  }
}
