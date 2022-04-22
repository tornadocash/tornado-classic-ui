import { graph } from '@/services'

export async function checkExistAccount({ getters, dispatch, rootState, rootGetters }) {
  const { ethAccount, netId } = rootState.metamask

  if (!ethAccount) {
    return
  }

  try {
    const rpc = rootGetters['settings/currentRpc']
    const web3 = this.$provider.getWeb3(rpc.url)
    const currentBlockNumber = await web3.eth.getBlockNumber()

    const isExist = await getEventsFromBlockPart(
      { getters, dispatch, rootState, rootGetters },
      { netId, currentBlockNumber, address: ethAccount }
    )
    console.log('isExist', isExist)

    dispatch('createMutation', {
      type: 'CHECK_ACCOUNT',
      payload: { isExist }
    })
  } catch (err) {
    throw new Error(`Method checkExistAccount has error: ${err.message}`)
  }
}

async function getEventsFromBlockPart(
  { getters, rootGetters, dispatch },
  { address, currentBlockNumber, netId }
) {
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

    return Boolean(Array.isArray(events) && Boolean(events.length))
  } catch (err) {
    console.log(`getEventsFromBlock has error: ${err.message}`)
    return false
  }
}
