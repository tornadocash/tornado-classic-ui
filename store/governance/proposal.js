/* eslint-disable no-console */
/* eslint-disable import/order */

import { utils } from 'ethers'
import uniqBy from 'lodash/uniqBy'
import chunk from 'lodash/chunk'

import { lookupAddresses, createBatchRequestCallback } from '@/services'
import { CHUNK_COUNT_PER_BATCH_REQUEST } from '@/constants'

const { toWei, fromWei, toBN } = require('web3-utils')

const CACHE_TX = {}
const CACHE_BLOCK = {}

const parseComment = (calldata, govInstance) => {
  const empty = { contact: '', message: '' }
  if (!calldata || !govInstance) return empty

  const methodLength = 4 // length of castDelegatedVote method
  const result = utils.defaultAbiCoder.decode(
    ['address[]', 'uint256', 'bool'],
    utils.hexDataSlice(calldata, methodLength)
  )
  const data = govInstance.methods.castDelegatedVote(...result).encodeABI()
  const dataLength = utils.hexDataLength(data)

  try {
    const str = utils.defaultAbiCoder.decode(['string'], utils.hexDataSlice(calldata, dataLength))
    const [contact, message] = JSON.parse(str)
    return { contact, message }
  } catch {
    return empty
  }
}

const createProposalComment = (resultAll, votedEvent) => {
  const { transactionHash, returnValues, blockNumber } = votedEvent
  const { voter } = returnValues

  const comment = parseComment()

  const percentage =
    toBN(votedEvent.returnValues.votes)
      .mul(toBN(10000))
      .divRound(resultAll)
      .toNumber() / 100

  return {
    id: `${transactionHash}-${voter}`,
    percentage,
    ...returnValues,
    votes: fromWei(returnValues.votes),
    transactionHash,
    blockNumber,

    ...comment,

    ens: {
      delegator: null,
      voter: null
    },
    delegator: null,
    timestamp: null
  }
}

const createFetchCommentWithMessage = (web3, batch, govInstance) => async (proposalComment) => {
  const { transactionHash, voter, blockNumber } = proposalComment

  if (!CACHE_TX[transactionHash]) {
    CACHE_TX[transactionHash] = new Promise((resolve, reject) => {
      const callback = createBatchRequestCallback(resolve, reject)
      batch.add(web3.eth.getTransaction.request(transactionHash, callback))
    })
  }

  if (!CACHE_BLOCK[blockNumber]) {
    CACHE_BLOCK[blockNumber] = new Promise((resolve, reject) => {
      const callback = createBatchRequestCallback(resolve, reject)
      batch.add(web3.eth.getBlock.request(blockNumber, callback))
    })
  }

  try {
    const [tx, blockInfo] = await Promise.all([CACHE_TX[transactionHash], CACHE_BLOCK[blockNumber]])

    const isMaybeHasComment = voter === tx.from
    const comment = parseComment(isMaybeHasComment ? tx.input : null, govInstance)

    return {
      ...proposalComment,
      ...comment,

      delegator: voter === tx.from ? null : tx.from,
      timestamp: blockInfo.timestamp
    }
  } catch (error) {
    CACHE_TX[transactionHash] = null
    CACHE_BLOCK[blockNumber] = null
    return proposalComment
  }
}

const state = () => {
  return {
    isFetchingComments: false,
    isFetchingMessages: false,
    ensNames: {},
    comments: []
  }
}

const getters = {
  comments: (state) => {
    const { ensNames } = state
    let comments = state.comments.slice()

    comments.sort((a, b) => b.blockNumber - a.blockNumber)
    comments = uniqBy(comments, 'voter')
    comments.sort((a, b) => b.percentage - a.percentage)

    comments = comments.map((data) => ({
      ...data,
      ens: {
        delegator: ensNames[data.delegator],
        voter: ensNames[data.voter]
      }
    }))

    return comments
  }
}

const mutations = {
  SAVE_FETCHING_COMMENTS(state, status) {
    state.isFetchingComments = status
  },
  SAVE_FETCHING_MESSAGES(state, status) {
    state.isFetchingMessages = status
  },
  SAVE_ENS_NAMES(state, ensNames) {
    state.ensNames = { ...state.ensNames, ...ensNames }
  },
  SAVE_COMMENTS(state, comments) {
    state.comments = comments
  }
}

const actions = {
  async fetchComments(context, proposal) {
    const { commit, dispatch, state } = context
    let { comments } = state
    let newComments = []

    if (comments[0]?.id !== proposal.id) {
      commit('SAVE_COMMENTS', [])
      comments = []
    }

    commit('SAVE_FETCHING_COMMENTS', true)
    newComments = await dispatch('fetchVotedEvents', { proposal, comments })
    commit('SAVE_FETCHING_COMMENTS', false)

    if (!newComments) return
    commit('SAVE_COMMENTS', newComments.concat(comments))
    dispatch('fetchEnsNames', { comments: newComments })

    commit('SAVE_FETCHING_MESSAGES', true)
    // TODO: TC-163 - add pagination
    newComments = await dispatch('fetchCommentsMessages', { comments: newComments })
    commit('SAVE_FETCHING_MESSAGES', false)

    if (!newComments) return
    commit('SAVE_COMMENTS', newComments.concat(comments))
  },
  async fetchVotedEvents(context, { proposal, comments }) {
    const { rootGetters } = context
    let { blockNumber: fromBlock } = proposal

    const netId = rootGetters['metamask/netId']
    const govInstance = rootGetters['governance/gov/govContract']({ netId })

    if (comments[0]?.id === proposal.id) {
      fromBlock = comments[0].blockNumber + 1
    }

    try {
      let votedEvents = await govInstance.getPastEvents('Voted', {
        filter: {
          // support: [false],
          proposalId: proposal.id
        },
        fromBlock,
        toBlock: 'latest'
      })

      console.log('fetchVotedEvents', votedEvents.length)

      votedEvents = votedEvents.sort((a, b) => b.blockNumber - a.blockNumber)
      votedEvents = uniqBy(votedEvents, 'returnValues.voter')

      console.log('fetchVotedEvents uniq', votedEvents.length)

      const resultAll = toBN(toWei(proposal.results.for)).add(toBN(toWei(proposal.results.against)))
      let newComments = votedEvents.map((votedEvent) => createProposalComment(resultAll, votedEvent))
      newComments = newComments.concat(comments)
      return newComments
    } catch (e) {
      console.error('fetchVotedEvents', e.message)
      return null
    }
  },
  async fetchCommentsMessages(context, { comments }) {
    const { rootGetters } = context

    const netId = rootGetters['metamask/netId']
    const govInstance = rootGetters['governance/gov/govContract']({ netId })
    const web3 = rootGetters['governance/gov/getWeb3']({ netId })
    const commentListChunks = chunk(comments, CHUNK_COUNT_PER_BATCH_REQUEST)

    let results = []

    try {
      for await (const list of commentListChunks) {
        const batch = new web3.BatchRequest()
        const fetchCommentsWithMessages = createFetchCommentWithMessage(web3, batch, govInstance)
        const promises = list.map(fetchCommentsWithMessages)
        batch.execute()
        const result = await Promise.all(promises)

        results = results.concat(result)
      }

      return results
    } catch (e) {
      console.error('fetchCommentsMessages', e.message)
    }
  },
  async fetchEnsNames(context, { comments }) {
    const { rootGetters, commit } = context

    const netId = rootGetters['metamask/netId']
    const web3 = rootGetters['governance/gov/getWeb3']({ netId })

    try {
      const addresses = comments
        .map((_) => _.voter)
        .flat()
        .filter(Boolean)

      console.log('fetchEnsNames', addresses.length)

      const ensNames = await lookupAddresses(addresses, web3)

      commit('SAVE_ENS_NAMES', ensNames)
    } catch (e) {
      console.error('fetchEnsNames', e.message)
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
