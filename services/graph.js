import { ApolloClient, InMemoryCache, gql } from '@apollo/client/core'

import {
  _META,
  GET_DEPOSITS,
  GET_STATISTIC,
  GET_REGISTERED,
  GET_WITHDRAWALS,
  GET_NOTE_ACCOUNTS,
  GET_ENCRYPTED_NOTES
} from './queries'

const isEmptyArray = (arr) => !Array.isArray(arr) || !arr.length

const first = 1000

const link = ({ getContext }) => {
  const { chainId } = getContext()
  return CHAIN_GRAPH_URLS[chainId]
}

const CHAIN_GRAPH_URLS = {
  1: 'https://api.thegraph.com/subgraphs/name/tornadocash/mainnet-tornado-subgraph',
  5: 'https://api.thegraph.com/subgraphs/name/tornadocash/goerli-tornado-subgraph',
  10: 'https://api.thegraph.com/subgraphs/name/tornadocash/optimism-tornado-subgraph',
  56: 'https://api.thegraph.com/subgraphs/name/tornadocash/bsc-tornado-subgraph',
  100: 'https://api.thegraph.com/subgraphs/name/tornadocash/xdai-tornado-subgraph',
  137: 'https://api.thegraph.com/subgraphs/name/tornadocash/matic-tornado-subgraph',
  42161: 'https://api.thegraph.com/subgraphs/name/tornadocash/arbitrum-tornado-subgraph',
  43114: 'https://api.thegraph.com/subgraphs/name/tornadocash/avalanche-tornado-subgraph'
}

const defaultOptions = {
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all'
  }
}

const client = new ApolloClient({
  uri: link,
  cache: new InMemoryCache(),
  defaultOptions
})

const registryClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/tornadocash/tornado-relayer-registry',
  cache: new InMemoryCache(),
  defaultOptions
})

async function getStatistic({ currency, amount, netId }) {
  try {
    const { data } = await client.query({
      context: {
        chainId: netId
      },
      query: gql(GET_STATISTIC),
      variables: {
        currency,
        first: 10,
        orderBy: 'index',
        orderDirection: 'desc',
        amount: String(amount)
      }
    })

    if (!data) {
      return {
        lastSyncBlock: '',
        events: []
      }
    }

    const { deposits } = data

    const lastSyncBlock = await getMeta({ netId })

    const events = deposits
      .map((e) => ({
        timestamp: e.timestamp,
        leafIndex: Number(e.index),
        blockNumber: Number(e.blockNumber)
      }))
      .reverse()

    const [lastEvent] = events.slice(-1)

    return {
      lastSyncBlock: lastEvent?.blockNumber >= lastSyncBlock ? lastEvent.blockNumber + 1 : lastSyncBlock,
      events
    }
  } catch {
    return {
      lastSyncBlock: '',
      events: []
    }
  }
}

async function getAllRegisters(fromBlock) {
  try {
    const relayers = await getRegisters(fromBlock)

    if (!relayers) {
      return { lastSyncBlock: '', events: [] }
    }

    const lastSyncBlock = await getRegisteredMeta()

    return { lastSyncBlock, events: relayers }
  } catch {
    return { lastSyncBlock: '', events: [] }
  }
}
async function getAllDeposits({ currency, amount, fromBlock, netId }) {
  try {
    let deposits = []

    while (true) {
      let result = await getDeposits({ currency, amount, fromBlock, netId })

      if (isEmptyArray(result)) {
        break
      }

      if (result.length < 900) {
        deposits = deposits.concat(result)
        break
      }

      const [lastEvent] = result.slice(-1)

      result = result.filter((e) => e.blockNumber !== lastEvent.blockNumber)
      fromBlock = Number(lastEvent.blockNumber)

      deposits = deposits.concat(result)
    }

    if (!deposits) {
      return {
        lastSyncBlock: '',
        events: []
      }
    }

    const lastSyncBlock = await getMeta({ netId })

    const data = deposits.map((e) => ({
      timestamp: e.timestamp,
      commitment: e.commitment,
      leafIndex: Number(e.index),
      blockNumber: Number(e.blockNumber),
      transactionHash: e.transactionHash
    }))

    const [lastEvent] = data.slice(-1)

    return {
      events: data,
      lastSyncBlock: lastEvent?.blockNumber >= lastSyncBlock ? lastEvent.blockNumber + 1 : lastSyncBlock
    }
  } catch {
    return {
      lastSyncBlock: '',
      events: []
    }
  }
}

async function getMeta({ netId }) {
  try {
    const { data } = await client.query({
      context: {
        chainId: netId
      },
      query: gql(_META)
    })

    if (!data) {
      return undefined
    }

    return data._meta.block.number
  } catch {
    return undefined
  }
}

async function getRegisteredMeta() {
  try {
    const { data } = await registryClient.query({
      context: {
        chainId: 1
      },
      query: gql(_META)
    })

    if (!data) {
      return undefined
    }

    return data._meta.block.number
  } catch {
    return undefined
  }
}

async function getRegisters(fromBlock) {
  const { data } = await registryClient.query({
    context: {
      chainId: 1
    },
    query: gql(GET_REGISTERED),
    variables: { first, fromBlock }
  })

  if (!data) {
    return []
  }

  return data.relayers
}

async function getDeposits({ currency, amount, fromBlock, netId }) {
  const { data } = await client.query({
    context: {
      chainId: netId
    },
    query: gql(GET_DEPOSITS),
    variables: { currency, amount: String(amount), first, fromBlock }
  })

  if (!data) {
    return []
  }

  return data.deposits
}

async function getAllWithdrawals({ currency, amount, fromBlock, netId }) {
  try {
    let withdrawals = []

    while (true) {
      let result = await getWithdrawals({ currency, amount, fromBlock, netId })

      if (isEmptyArray(result)) {
        break
      }

      if (result.length < 900) {
        withdrawals = withdrawals.concat(result)
        break
      }

      const [lastEvent] = result.slice(-1)

      result = result.filter((e) => e.blockNumber !== lastEvent.blockNumber)
      fromBlock = Number(lastEvent.blockNumber)

      withdrawals = withdrawals.concat(result)
    }

    if (!withdrawals) {
      return {
        lastSyncBlock: '',
        events: []
      }
    }

    const lastSyncBlock = await getMeta({ netId })

    const data = withdrawals.map((e) => ({
      to: e.to,
      fee: e.fee,
      timestamp: e.timestamp,
      nullifierHash: e.nullifier,
      blockNumber: Number(e.blockNumber),
      transactionHash: e.transactionHash
    }))

    const [lastEvent] = data.slice(-1)

    return {
      events: data,
      lastSyncBlock: lastEvent?.blockNumber >= lastSyncBlock ? lastEvent.blockNumber + 1 : lastSyncBlock
    }
  } catch {
    return {
      lastSyncBlock: '',
      events: []
    }
  }
}

async function getWithdrawals({ currency, amount, fromBlock, netId }) {
  const { data } = await client.query({
    context: {
      chainId: netId
    },
    query: gql(GET_WITHDRAWALS),
    variables: { currency, amount: String(amount), fromBlock, first }
  })

  if (!data) {
    return []
  }

  return data.withdrawals
}

async function getNoteAccounts({ address, netId }) {
  try {
    const { data } = await client.query({
      context: {
        chainId: netId
      },
      query: gql(GET_NOTE_ACCOUNTS),
      variables: { address }
    })

    if (!data) {
      return {
        lastSyncBlock: '',
        events: []
      }
    }

    const lastSyncBlock = await getMeta({ netId })

    return {
      lastSyncBlock,
      events: data.noteAccounts
    }
  } catch {
    return {
      lastSyncBlock: '',
      events: []
    }
  }
}

async function getAllEncryptedNotes({ fromBlock, netId }) {
  try {
    let encryptedNotes = []

    while (true) {
      let result = await getEncryptedNotes({ fromBlock, netId })

      if (isEmptyArray(result)) {
        break
      }

      if (result.length < 900) {
        encryptedNotes = encryptedNotes.concat(result)
        break
      }

      const [lastEvent] = result.slice(-1)

      result = result.filter((e) => e.blockNumber !== lastEvent.blockNumber)
      fromBlock = Number(lastEvent.blockNumber)

      encryptedNotes = encryptedNotes.concat(result)

      if (isEmptyArray(result)) {
        break
      }
    }

    if (!encryptedNotes) {
      return {
        lastSyncBlock: '',
        events: []
      }
    }

    const lastSyncBlock = await getMeta({ netId })

    const data = encryptedNotes.map((e) => ({
      txHash: e.transactionHash,
      encryptedNote: e.encryptedNote,
      transactionHash: e.transactionHash,
      blockNumber: Number(e.blockNumber)
    }))

    const [lastEvent] = data.slice(-1)

    return {
      events: data,
      lastSyncBlock: lastEvent?.blockNumber >= lastSyncBlock ? lastEvent.blockNumber + 1 : lastSyncBlock
    }
  } catch {
    return {
      lastSyncBlock: '',
      events: []
    }
  }
}

async function getEncryptedNotes({ fromBlock, netId }) {
  const { data } = await client.query({
    context: {
      chainId: netId
    },
    query: gql(GET_ENCRYPTED_NOTES),
    variables: { fromBlock, first }
  })

  if (!data) {
    return []
  }

  return data.encryptedNotes
}

export default {
  getDeposits,
  getStatistic,
  getAllDeposits,
  getWithdrawals,
  getNoteAccounts,
  getAllRegisters,
  getAllWithdrawals,
  getAllEncryptedNotes
}
