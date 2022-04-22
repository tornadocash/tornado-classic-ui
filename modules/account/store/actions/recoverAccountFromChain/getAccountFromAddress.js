import { graph } from '@/services'
import { unpackEncryptedMessage } from '@/utils'

export async function getAccountFromAddress({ getters, rootGetters }, address) {
  try {
    const netId = rootGetters['metamask/netId']

    const rpc = rootGetters['settings/currentRpc']
    const web3 = this.$provider.getWeb3(rpc.url)
    const currentBlockNumber = await web3.eth.getBlockNumber()

    const events = await getEventsFromBlockPart({ getters }, { netId, currentBlockNumber, address })

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

async function getEventsFromBlockPart({ getters }, { address, currentBlockNumber, netId }) {
  try {
    const { events: graphEvents, lastSyncBlock } = await graph.getNoteAccounts({ address, netId })

    const blockDifference = Math.ceil(currentBlockNumber - lastSyncBlock)

    let blockRange = 1

    if (Number(netId) === 56) {
      blockRange = 4950
    }

    let numberParts = blockDifference === 0 ? 1 : Math.ceil(blockDifference / blockRange)
    const part = Math.ceil(blockDifference / numberParts)

    let events = []

    let fromBlock = lastSyncBlock
    let toBlock = lastSyncBlock + part

    if (toBlock >= currentBlockNumber) {
      toBlock = 'latest'
      numberParts = 1
    }

    for (let i = 0; i < numberParts; i++) {
      const partOfEvents = await getters.echoContract.getEvents({
        fromBlock,
        toBlock,
        address
      })
      if (partOfEvents) {
        events = events.concat(partOfEvents)
      }
      fromBlock = toBlock
      toBlock += part
    }

    events = graphEvents.concat(events)

    return events
  } catch (err) {
    console.log(`getEventsFromBlock has error: ${err.message}`)
    return false
  }
}
