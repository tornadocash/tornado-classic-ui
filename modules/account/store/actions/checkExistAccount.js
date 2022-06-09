import { getEventsFromBlockPart } from './utils'

export async function checkExistAccount({ getters, dispatch, rootState, rootGetters }) {
  const { ethAccount, netId } = rootState.metamask

  if (!ethAccount) {
    return
  }

  try {
    const rpc = rootGetters['settings/currentRpc']
    const web3 = this.$provider.getWeb3(rpc.url)
    const currentBlockNumber = await web3.eth.getBlockNumber()

    const events = await getEventsFromBlockPart({
      netId,
      currentBlockNumber,
      address: ethAccount,
      echoContract: getters.echoContract
    })

    const isExist = Boolean(Array.isArray(events) && Boolean(events.length))

    console.log('isExist', isExist)

    dispatch('createMutation', {
      type: 'CHECK_ACCOUNT',
      payload: { isExist }
    })
  } catch (err) {
    throw new Error(`Method checkExistAccount has error: ${err.message}`)
  }
}
