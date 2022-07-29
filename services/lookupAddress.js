// from https://github.com/ChainSafe/web3.js/issues/2683#issuecomment-547348416

import namehash from 'eth-ens-namehash'
import { BigNumber, utils } from 'ethers'
import ABI from 'web3-eth-ens/lib/resources/ABI/Resolver'
import uniq from 'lodash/uniq'
import chunk from 'lodash/chunk'
import { CHUNK_COUNT_PER_BATCH_REQUEST } from '@/constants'

export const createBatchRequestCallback = (resolve, reject) => (error, data) => {
  if (error) {
    reject(error)
  } else {
    resolve(data)
  }
}

const CACHE = {}

const createFetchNodeAddresses = (registryContract, batch) => async (address) => {
  const addressLower = address.toLowerCase()

  const node = addressLower.substr(2) + '.addr.reverse'
  const nodeHash = namehash.hash(node)
  let nodeAddress = null

  if (!CACHE[addressLower]) {
    try {
      nodeAddress = await new Promise((resolve, reject) => {
        const callback = createBatchRequestCallback(resolve, reject)
        const requestData = registryContract.methods.resolver(nodeHash).call.request(callback)
        batch.add(requestData)
      })

      if (+nodeAddress === 0) nodeAddress = null
    } catch (error) {
      console.error(`Error resolve ens for "${address}"`, error.message)
      // do nothing
    }
  }

  return {
    addressLower,
    address,
    nodeHash,
    nodeAddress
  }
}

const createFetchEnsNames = (web3, batch, results) => async (data) => {
  const { address, addressLower, nodeHash, nodeAddress } = data
  if (!nodeAddress) return results

  if (CACHE[addressLower]) {
    results[address] = CACHE[addressLower]
    return results
  }

  const nodeContract = new web3.eth.Contract(ABI, nodeAddress)

  try {
    const ensName = await new Promise((resolve, reject) => {
      const callback = createBatchRequestCallback(resolve, reject)
      const requestData = nodeContract.methods.name(nodeHash).call.request(callback)
      batch.add(requestData)
    })

    const isZeroAddress =
      ensName.trim().length && utils.isAddress(ensName) && BigNumber.from(ensName).isZero()

    if (isZeroAddress) return results

    CACHE[addressLower] = ensName
    results[address] = ensName

    return results
  } catch (error) {
    console.error(`Error lookupAddress ens for "${address}"`, error.message)
    return results
  }
}

export const lookupAddressesRequest = async (addressList, web3, registryContract) => {
  const fetchNodeAddressesBatch = new web3.BatchRequest()
  const fetchNodeAddresses = createFetchNodeAddresses(registryContract, fetchNodeAddressesBatch)
  const fetchNodeAddressesPromises = uniq(addressList).map(fetchNodeAddresses)
  fetchNodeAddressesBatch.execute()

  const nodeAddresses = await Promise.all(fetchNodeAddressesPromises)

  const results = {}
  const fetchEnsNamesBatch = new web3.BatchRequest()
  const fetchEnsNames = createFetchEnsNames(web3, fetchEnsNamesBatch, results)
  const fetchEnsNamesPromises = nodeAddresses.map(fetchEnsNames)
  fetchEnsNamesBatch.execute()

  await Promise.all(fetchEnsNamesPromises)
  return results
}

export const lookupAddresses = async (addressList, web3) => {
  const registryContract = await web3.eth.ens.registry.contract
  // web3.eth.ens._lastSyncCheck = Date.now() // - need for test in fork

  const addressListChunks = chunk(addressList, CHUNK_COUNT_PER_BATCH_REQUEST)
  let results = {}

  for await (const list of addressListChunks) {
    const result = await lookupAddressesRequest(list, web3, registryContract)
    results = { ...results, ...result }
  }

  return results
}
