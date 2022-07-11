/* eslint-disable no-console */
import Web3 from 'web3'
import BN from 'bignumber.js'
import namehash from 'eth-ens-namehash'

import { schema, relayerRegisterService } from '@/services'
import { createChainIdState, parseNote, parseSemanticVersion } from '@/utils'

import ENSABI from '@/abis/ENS.abi.json'
import networkConfig from '@/networkConfig'

const getAxios = () => {
  return import('axios')
}

const calculateScore = ({ stakeBalance, tornadoServiceFee }, minFee = 0.33, maxFee = 0.53) => {
  if (tornadoServiceFee < minFee) {
    tornadoServiceFee = minFee
  } else if (tornadoServiceFee >= maxFee) {
    return new BN(0)
  }

  const serviceFeeCoefficient = (tornadoServiceFee - minFee) ** 2
  const feeDiffCoefficient = 1 / (maxFee - minFee) ** 2
  const coefficientsMultiplier = 1 - feeDiffCoefficient * serviceFeeCoefficient

  return new BN(stakeBalance).multipliedBy(coefficientsMultiplier)
}

const getWeightRandom = (weightsScores, random) => {
  for (let i = 0; i < weightsScores.length; i++) {
    if (random.isLessThan(weightsScores[i])) {
      return i
    }
    random = random.minus(weightsScores[i])
  }
  return Math.floor(Math.random() * weightsScores.length)
}

const pickWeightedRandomRelayer = (items, netId) => {
  let minFee, maxFee

  if (netId !== 1) {
    minFee = 0.01
    maxFee = 0.3
  }

  const weightsScores = items.map((el) => calculateScore(el, minFee, maxFee))
  const totalWeight = weightsScores.reduce((acc, curr) => {
    return (acc = acc.plus(curr))
  }, new BN('0'))

  const random = totalWeight.multipliedBy(Math.random())
  const weightRandomIndex = getWeightRandom(weightsScores, random)

  return items[weightRandomIndex]
}

const initialJobsState = createChainIdState({
  tornado: {}
})

export const state = () => {
  return {
    prices: {
      dai: '6700000000000000'
    },
    selectedRelayer: {
      url: '',
      name: '',
      stakeBalance: 0,
      tornadoServiceFee: 0.05,
      miningServiceFee: 0.05,
      address: null,
      ethPrices: {
        torn: '1'
      }
    },
    isLoadingRelayers: false,
    validRelayers: [],
    jobs: initialJobsState,
    jobWatchers: {}
  }
}

export const getters = {
  ethProvider: (state, getters, rootState) => {
    const { url } = rootState.settings.netId1.rpc

    return new Web3(url)
  },
  jobs: (state, getters, rootState, rootGetters) => (type) => {
    const netId = rootGetters['metamask/netId']
    const jobsToRender = Object.entries(state.jobs[`netId${netId}`][type])
      .reverse()
      .map(
        ([
          id,
          {
            action,
            relayerUrl,
            amount,
            currency,
            fee,
            timestamp,
            txHash,
            confirmations,
            status,
            failedReason
          }
        ]) => {
          return {
            id,
            action,
            relayerUrl,
            amount,
            currency,
            fee,
            timestamp,
            txHash,
            confirmations,
            status,
            failedReason
          }
        }
      )
    return jobsToRender
  }
}

export const mutations = {
  SET_SELECTED_RELAYER(state, payload) {
    this._vm.$set(state, 'selectedRelayer', payload)
  },
  SAVE_VALIDATED_RELAYERS(state, relayers) {
    state.validRelayers = relayers
  },
  SAVE_JOB(
    state,
    {
      id,
      netId,
      type,
      action,
      relayerUrl,
      amount,
      currency,
      fee,
      commitmentHex,
      timestamp,
      note,
      accountAfter,
      account
    }
  ) {
    this._vm.$set(state.jobs[`netId${netId}`][type], id, {
      action,
      relayerUrl,
      amount,
      currency,
      fee,
      commitmentHex,
      timestamp,
      note,
      accountAfter,
      account
    })
  },
  UPDATE_JOB(state, { id, netId, type, txHash, confirmations, status, failedReason }) {
    const job = state.jobs[`netId${netId}`][type][id]
    this._vm.$set(state.jobs[`netId${netId}`][type], id, {
      ...job,
      txHash,
      confirmations,
      status,
      failedReason
    })
  },
  DELETE_JOB(state, { id, netId, type }) {
    this._vm.$delete(state.jobs[`netId${netId}`][type], id)
  },
  ADD_JOB_WATCHER(state, { id, timerId }) {
    this._vm.$set(state.jobWatchers, id, {
      timerId
    })
  },
  DELETE_JOB_WATCHER(state, { id }) {
    this._vm.$delete(state.jobWatchers, id)
  },
  SET_IS_LOADING_RELAYERS(state, isLoadingRelayers) {
    state.isLoadingRelayers = isLoadingRelayers
  }
}

export const actions = {
  async askRelayerStatus(
    { rootState, dispatch, rootGetters },
    { hostname, relayerAddress, stakeBalance, ensName }
  ) {
    try {
      const axios = await getAxios()

      if (!hostname.endsWith('/')) {
        hostname += '/'
      }

      const url = `${window.location.protocol}//${hostname}`
      const response = await axios.get(`${url}status`, { timeout: 5000 }).catch(() => {
        throw new Error(this.app.i18n.t('canNotFetchStatusFromTheRelayer'))
      })

      if (Number(response.data.currentQueue) > 5) {
        throw new Error(this.app.i18n.t('withdrawalQueueIsOverloaded'))
      }

      const netId = Number(rootGetters['metamask/netId'])

      if (Number(response.data.netId) !== netId) {
        throw new Error(this.app.i18n.t('thisRelayerServesADifferentNetwork'))
      }

      const validate = schema.getRelayerValidateFunction(netId)

      // check rewardAccount === relayerAddress for TORN burn, custom relayer - exception
      if (netId === 1 && relayerAddress && response.data.rewardAccount !== relayerAddress) {
        throw new Error('The Relayer reward address must match registered address')
      }

      const isValid = validate(response.data)
      if (!isValid) {
        console.error('askRelayerStatus', ensName, validate?.errors)

        throw new Error(this.app.i18n.t('canNotFetchStatusFromTheRelayer'))
      }

      const hasEnabledLightProxy = rootGetters['application/hasEnabledLightProxy']

      const getIsUpdated = () => {
        const relayerVersion = response.data.version

        if (relayerVersion === '5.0.0') {
          return true
        }

        const requiredMajor = hasEnabledLightProxy ? '5' : '4'
        const { major, patch, prerelease } = parseSemanticVersion(relayerVersion)

        const isUpdatedMajor = major === requiredMajor

        if (isUpdatedMajor && prerelease) {
          const minimalBeta = 11
          const [betaVersion] = prerelease.split('.').slice(-1)
          return Number(betaVersion) >= minimalBeta
        }

        const minimalPatch = 4
        return isUpdatedMajor && Number(patch) >= minimalPatch
      }

      if (!getIsUpdated()) {
        throw new Error('Outdated version.')
      }

      return {
        isValid,
        realUrl: url,
        stakeBalance,
        name: ensName,
        relayerAddress,
        netId: response.data.netId,
        ethPrices: response.data.ethPrices,
        address: response.data.rewardAccount,
        currentQueue: response.data.currentQueue,
        miningServiceFee: response.data.miningServiceFee,
        tornadoServiceFee: response.data.tornadoServiceFee
      }
    } catch (e) {
      console.error('askRelayerStatus', ensName, e.message)
      return { isValid: false, error: e.message }
    }
  },
  async observeRelayer({ dispatch }, { relayer }) {
    const result = await dispatch('askRelayerStatus', relayer)

    return result
  },
  async pickRandomRelayer({ rootGetters, commit, dispatch, getters }) {
    const netId = rootGetters['metamask/netId']
    const { ensSubdomainKey } = rootGetters['metamask/networkConfig']

    commit('SET_IS_LOADING_RELAYERS', true)

    const registeredRelayers = await relayerRegisterService(getters.ethProvider).getRelayers(ensSubdomainKey)

    const requests = []
    for (const registeredRelayer of registeredRelayers) {
      requests.push(dispatch('observeRelayer', { relayer: registeredRelayer }))
    }
    let statuses = await Promise.all(requests)

    statuses = statuses.filter((status) => status.isValid)
    // const validRelayerENSnames = statuses.map((relayer) => relayer.name)
    commit('SAVE_VALIDATED_RELAYERS', statuses)
    console.log('filtered statuses ', statuses)

    try {
      const {
        name,
        realUrl,
        address,
        ethPrices,
        stakeBalance,
        tornadoServiceFee,
        miningServiceFee
      } = pickWeightedRandomRelayer(statuses, netId)

      console.log('Selected relayer', name, tornadoServiceFee)
      commit('SET_SELECTED_RELAYER', {
        name,
        address,
        ethPrices,
        url: realUrl,
        stakeBalance,
        tornadoServiceFee,
        miningServiceFee
      })
    } catch {
      console.error('Method pickRandomRelayer has not picked relayer')
    }

    commit('SET_IS_LOADING_RELAYERS', false)
  },
  async getKnownRelayerData({ rootGetters, getters }, { relayerAddress, name }) {
    const { ensSubdomainKey } = rootGetters['metamask/networkConfig']

    const [validRelayer] = await relayerRegisterService(getters.ethProvider).getValidRelayers(
      [{ relayerAddress, ensName: name.replace(`${ensSubdomainKey}.`, '') }],
      ensSubdomainKey
    )
    console.warn('validRelayer', validRelayer)
    return validRelayer
  },
  async getCustomRelayerData({ rootState, state, getters, rootGetters, dispatch }, { url, name }) {
    const provider = getters.ethProvider.eth

    const PROTOCOL_REGEXP = /^(http(s?))/
    if (!PROTOCOL_REGEXP.test(url)) {
      if (url.endsWith('.onion')) {
        url = `http://${url}`
      } else {
        url = `https://${url}`
      }
    }

    const urlParser = new URL(url)
    urlParser.href = url
    let ensName = name

    if (urlParser.hostname.endsWith('.eth')) {
      ensName = urlParser.hostname
      let resolverInstance = await provider.ens.getResolver(ensName)

      if (new BN(resolverInstance._address).isZero()) {
        throw new Error('missingENSSubdomain')
      }
      resolverInstance = new provider.Contract(ENSABI, resolverInstance._address)

      const ensNameHash = namehash.hash(ensName)
      const hostname = await resolverInstance.methods.text(ensNameHash, 'url').call()

      if (!hostname) {
        throw new Error('canNotFetchStatusFromTheRelayer')
      }
      urlParser.host = hostname
    }

    const hostname = urlParser.host

    return { hostname, ensName, stakeBalance: 0 }
  },
  async getRelayerData({ state, dispatch }, { url, name }) {
    const knownRelayer = state.validRelayers.find((el) => el.name === name)

    if (knownRelayer) {
      const knownRelayerData = await dispatch('getKnownRelayerData', knownRelayer)
      return knownRelayerData
    }

    const customRelayerData = await dispatch('getCustomRelayerData', { url, name })
    return customRelayerData
  },
  async setupRelayer({ commit, rootState, dispatch }, { url, name }) {
    try {
      const relayerData = await dispatch('getRelayerData', { url, name })

      const {
        error,
        isValid,
        realUrl,
        address,
        ethPrices,
        miningServiceFee,
        tornadoServiceFee
      } = await dispatch('askRelayerStatus', relayerData)

      if (!isValid) {
        return { error, isValid: false }
      }

      return {
        isValid,
        name,
        url: realUrl || '',
        address: address || '',
        tornadoServiceFee: tornadoServiceFee || 0.0,
        miningServiceFee: miningServiceFee || 0.0,
        ethPrices: ethPrices || { torn: '1' }
      }
    } catch (err) {
      return {
        isValid: false,
        error: this.app.i18n.t(err.message)
      }
    }
  },
  async relayTornadoWithdraw({ state, commit, dispatch, rootState }, { note }) {
    const { currency, netId, amount, commitmentHex } = parseNote(note)

    const config = networkConfig[`netId${netId}`]
    const contract = config.tokens[currency].instanceAddress[amount]

    try {
      const { proof, args } = rootState.application.notes[note]
      const message = {
        args,
        proof,
        contract
      }

      dispatch(
        'loading/changeText',
        { message: this.app.i18n.t('relayerIsNowSendingYourTransaction') },
        { root: true }
      )

      const response = await fetch(state.selectedRelayer.url + 'v1/tornadoWithdraw', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json'
        },
        redirect: 'error',
        body: JSON.stringify(message)
      })

      if (response.status === 400) {
        const { error } = await response.json()
        throw new Error(error)
      }

      if (response.status === 200) {
        const { id } = await response.json()
        const timestamp = Math.round(new Date().getTime() / 1000)
        commit('SAVE_JOB', {
          id,
          netId,
          type: 'tornado',
          action: 'Deposit',
          relayerUrl: state.selectedRelayer.url,
          commitmentHex,
          amount,
          currency,
          timestamp,
          note
        })

        dispatch('runJobWatcherWithNotifications', { id, type: 'tornado', netId })
      } else {
        throw new Error(this.app.i18n.t('unknownError'))
      }
    } catch (e) {
      console.error('relayTornadoWithdraw', e)
      const { name, url } = state.selectedRelayer
      throw new Error(this.app.i18n.t('relayRequestFailed', { relayerName: name === 'custom' ? url : name }))
    }
  },
  async runJobWatcherWithNotifications({ dispatch, state }, { routerLink, id, netId, type }) {
    const { amount, currency } = state.jobs[`netId${netId}`][type][id]
    const noticeId = await dispatch(
      'notice/addNotice',
      {
        notice: {
          title: {
            path: 'withdrawing',
            amount,
            currency
          },
          type: 'loading',
          routerLink
        }
      },
      { root: true }
    )

    try {
      await dispatch('runJobWatcher', { id, netId, type, noticeId })
      dispatch('deleteJob', { id, netId, type })
    } catch (err) {
      dispatch(
        'notice/updateNotice',
        {
          id: noticeId,
          notice: {
            title: 'transactionFailed',
            type: 'danger',
            routerLink: undefined
          }
        },
        { root: true }
      )
      dispatch(
        'notice/addNoticeWithInterval',
        {
          notice: {
            title: 'relayerError',
            type: 'danger'
          }
        },
        { root: true }
      )
    }
  },
  deleteJob({ state, dispatch, commit }, { id, netId, type }) {
    dispatch('stopFinishJobWatcher', { id })
    const { amount, currency, action, fee, txHash, note } = state.jobs[`netId${netId}`][type][id]

    commit('DELETE_JOB', { id, netId, type })

    dispatch(
      'txHashKeeper/updateDeposit',
      { amount, currency, netId, type, action, note, txHash, fee },
      { root: true }
    )
  },
  runJobWatcher({ state, dispatch }, { id, netId, type, noticeId }) {
    console.log('runJobWatcher started for job', id)
    return new Promise((resolve, reject) => {
      const getConfirmations = async ({ id, netId, type, noticeId, retryAttempt = 0, noticeCalls = 0 }) => {
        try {
          const job = state.jobs[`netId${netId}`][type][id]

          if (job.status === 'FAILED') {
            retryAttempt = 6
            throw new Error('Relayer is not responding')
          }

          const response = await fetch(`${job.relayerUrl}v1/jobs/${id}`, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
              'Content-Type': 'application/json'
            },
            redirect: 'error'
          })
          if (response.status === 400) {
            const { error } = await response.json()
            console.error('runJobWatcher', error)
            throw new Error(this.app.i18n.t('relayerError'))
          }

          if (response.status === 200) {
            await dispatch('handleResponse', {
              id,
              response,
              job,
              type,
              netId,
              retryAttempt,
              noticeId,
              noticeCalls,
              resolve,
              getConfirmations
            })
          } else {
            throw new Error(this.app.i18n.t('unknownError'))
          }
        } catch (e) {
          if (retryAttempt < 5) {
            retryAttempt++

            setTimeout(
              () =>
                getConfirmations({
                  id,
                  netId,
                  type,
                  noticeId,
                  retryAttempt,
                  noticeCalls
                }),
              3000
            )
          }
          reject(e.message)
        }
      }
      getConfirmations({ id, netId, type, noticeId })
      dispatch('finishJobWatcher', { id, netId, type })
    })
  },
  async handleResponse(
    { state, rootGetters, commit, dispatch, getters, rootState },
    { response, id, job, type, netId, retryAttempt, resolve, getConfirmations, noticeId, noticeCalls }
  ) {
    const { amount, currency } = job
    const { txHash, confirmations, status, failedReason } = await response.json()
    console.log('txHash, confirmations, status, failedReason', txHash, confirmations, status, failedReason)
    commit('UPDATE_JOB', { id, netId, type, txHash, confirmations, status, failedReason })

    if (status === 'FAILED') {
      dispatch('stopFinishJobWatcher', { id })
      commit('DELETE_JOB', { id, netId, type })
      retryAttempt = 6
      console.error('runJobWatcher.handleResponse', failedReason)

      throw new Error(this.app.i18n.t('relayerError'))
    }

    if (txHash && noticeCalls === 0 && (Number(confirmations) > 0 || status === 'CONFIRMED')) {
      noticeCalls++

      dispatch(
        'notice/updateNotice',
        {
          id: noticeId,
          notice: {
            title: {
              path: 'withdrawnValue',
              amount,
              currency
            },
            type: 'success',
            txHash
          },
          interval: 10000
        },
        { root: true }
      )
    }

    if (status === 'CONFIRMED') {
      console.log(`Job ${id} has enough confirmations`)
      resolve(txHash)
    } else {
      setTimeout(() => getConfirmations({ id, netId, type, noticeId, retryAttempt, noticeCalls }), 3000)
    }
  },
  finishJobWatcher({ state, rootGetters, commit, dispatch, getters, rootState }, { id, netId, type }) {
    const timerId = setTimeout(() => {
      const { txHash, confirmations } = state.jobs[`netId${netId}`][type][id]
      commit('UPDATE_JOB', {
        id,
        netId,
        type,
        txHash,
        confirmations,
        status: 'FAILED',
        failedReason: this.app.i18n.t('relayerIsNotResponding')
      })
      commit('DELETE_JOB_WATCHER', { id })
    }, 15 * 60 * 1000)
    commit('ADD_JOB_WATCHER', { id, timerId })
  },
  stopFinishJobWatcher({ state, rootGetters, commit, dispatch, getters, rootState }, { id }) {
    console.log(`Stop finishJobWatcher ${id}`)
    const { timerId } = state.jobWatchers[id]
    clearTimeout(timerId)
    commit('DELETE_JOB_WATCHER', { id })
  },
  runAllJobs({ state, commit, dispatch, rootState }) {
    const netId = rootState.metamask.netId
    const jobs = state.jobs[`netId${netId}`]

    for (const type in jobs) {
      for (const [id, { status }] of Object.entries(jobs[type])) {
        const job = { id, netId, type }
        if (status === 'FAILED') {
          commit('DELETE_JOB', job)
        } else {
          dispatch('runJobWatcherWithNotifications', job)
        }
      }
    }
  }
}
