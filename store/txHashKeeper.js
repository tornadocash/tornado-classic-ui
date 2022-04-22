/* eslint-disable no-console */
import { hexToNumber } from 'web3-utils'

import txStatus from './txStatus'

import { eventsType } from '@/constants'
import { createChainIdState, parseNote } from '@/utils'

const initialState = createChainIdState({
  txs: {},
  govTxs: {},
  encryptedTxs: {}
})

export const state = () => {
  return initialState
}

export const getters = {
  txExplorerUrl: (state, getters, rootState, rootGetters) => (txHash) => {
    const { explorerUrl } = rootGetters['metamask/networkConfig']
    return explorerUrl.tx + txHash
  },
  addressExplorerUrl: (state, getters, rootState, rootGetters) => (address) => {
    const { explorerUrl } = rootGetters['metamask/networkConfig']
    return explorerUrl.address + address
  },
  blockExplorerUrl: (state, getters, rootState, rootGetters) => (block) => {
    const { explorerUrl } = rootGetters['metamask/networkConfig']
    return explorerUrl.block + block
  },
  encryptedTxs: (state, getters, rootState, rootGetters) => {
    const netId = rootGetters['metamask/netId']

    const txsToRender = Object.entries(state[`netId${netId}`].encryptedTxs)
      .reverse()
      .map(([txHash, tx]) => {
        return {
          isEncrypted: true,
          txHash,
          status,
          ...tx
        }
      })
    return txsToRender
  },
  txs: (state, getters, rootState, rootGetters) => {
    const netId = rootGetters['metamask/netId']
    const txsToRender = Object.entries(state[`netId${netId}`].txs)
      .reverse()
      .map(([txHash, tx]) => {
        return {
          txHash,
          status,
          ...tx
        }
      })
    return txsToRender
  },
  allTxs: (state, getters) => {
    const { txs, encryptedTxs } = getters
    return txs.concat(encryptedTxs)
  },
  allTxsHash: (state, getters, rootState, rootGetters) => {
    const netId = rootGetters['metamask/netId']
    return Object.entries(state[`netId${netId}`].txs)
      .reverse()
      .map(([txHash]) => txHash)
  },
  txStatusClass: () => (status) => {
    let cssClass
    switch (status) {
      case txStatus.waitingForReciept:
        cssClass = 'is-loading'
        break
      case txStatus.success:
        cssClass = 'is-success'
        break
      case txStatus.fail:
        cssClass = 'is-danger'
        break
      default:
        break
    }
    return cssClass
  }
}

export const mutations = {
  SAVE_TX_HASH(state, { storeType = 'txs', amount = '0', note = null, netId, txHash, status, ...rest }) {
    this._vm.$set(state[`netId${netId}`][storeType], [txHash], {
      ...rest,
      status: status || txStatus.waitingForReciept,
      note,
      amount
    })
  },
  CHANGE_TX_STATUS(state, { storeType = 'txs', txHash, status, blockNumber, netId }) {
    this._vm.$set(state[`netId${netId}`][storeType][txHash], 'status', status)
    this._vm.$set(state[`netId${netId}`][storeType][txHash], 'blockNumber', blockNumber)
  },
  SET_SPENT(state, { netId, storeType = 'txs', txHash }) {
    this._vm.$set(state[`netId${netId}`][storeType][txHash], 'isSpent', true)
  },
  DELETE_TX(state, { storeType = 'txs', txHash }) {
    const netId = this._vm['metamask/netId']
    this._vm.$delete(state[`netId${netId}`][storeType], txHash)
  },
  UPDATE_DEPOSIT(state, { storeType = 'txs', txHash, netId, withdrawTxHash, timestamp, status, ...rest }) {
    const tx = state[`netId${netId}`][storeType][txHash]
    this._vm.$delete(state[`netId${netId}`][storeType], txHash)

    this._vm.$set(state[`netId${netId}`][storeType], withdrawTxHash, {
      ...tx,
      timestamp,
      depositTxHash: txHash,
      txHash: withdrawTxHash,
      depositBlock: tx.blockNumber,
      status: status || txStatus.waitingForReciept,
      ...rest
    })
  }
}

export const actions = {
  async getInstances({ rootGetters }, { txs }) {
    const eventsInterface = rootGetters['application/eventsInterface']

    const instances = txs.reduce((acc, curr) => {
      const [, currency, amount, netId] = curr.prefix.split('-')

      const name = `${amount}${currency}`
      if (!acc[name]) {
        const service = eventsInterface.getService({ netId, amount, currency })
        acc[name] = { currency, amount, netId, service }
      }
      return acc
    }, {})

    await Promise.all(
      [].concat(
        Object.values(instances).map((instance) => instance.service.updateEvents(eventsType.DEPOSIT)),
        Object.values(instances).map((instance) => instance.service.updateEvents(eventsType.WITHDRAWAL))
      )
    )

    return instances
  },
  async checkPendingEncryptedTransaction({ dispatch, getters }) {
    const transactions = getters.encryptedTxs

    const pendingTxs = transactions.filter((tx) => tx.status === 1)

    const instances = await dispatch('getInstances', { txs: pendingTxs })

    for (const tx of pendingTxs) {
      const [, currency, amount, netId] = tx.prefix.split('-')

      dispatch('checkSpeedUpEncryptedTx', {
        netId,
        txHash: tx.txHash,
        type: eventsType.DEPOSIT,
        commitment: tx.commitmentHex,
        service: instances[`${amount}${currency}`]
      })
    }
  },
  async checkSpeedUpEncryptedTx({ commit, dispatch }, { txHash, commitment, netId, service, type }) {
    try {
      const result = await this.$provider.web3.eth.getTransactionReceipt(txHash)

      if (result) {
        const status = result.status === '0x0' ? txStatus.fail : txStatus.success

        commit('CHANGE_TX_STATUS', {
          netId,
          txHash,
          status,
          storeType: 'encryptedTxs',
          blockNumber: hexToNumber(result.blockNumber)
        })
      } else {
        const foundEvent = await service.findEvent({ eventName: 'commitment', eventToFind: commitment, type })

        if (foundEvent) {
          commit('UPDATE_DEPOSIT', {
            netId,
            txHash,
            storeType: 'encryptedTxs',
            status: txStatus.success,
            timestamp: foundEvent.timestamp,
            withdrawTxHash: foundEvent.txHash,
            blockNumber: foundEvent.depositBlock
          })
        }
      }
    } catch (err) {
      throw new Error(`Method checkSpeedUpEncryptedTx has error ${err.message}`)
    }
  },
  async cleanEncryptedTxs({ getters, commit, dispatch }) {
    getters.encryptedTxs.forEach(({ status, txHash, type }) => {
      if (status === txStatus.fail) {
        commit('DELETE_TX', { txHash, storeType: 'encryptedTxs' })
      }
    })

    const instances = await dispatch('getInstances', {
      txs: getters.encryptedTxs
    })

    for (const tx of getters.encryptedTxs) {
      if (!tx.isSpent) {
        const { currency, amount, netId, nullifierHex } = parseNote(`${tx.prefix}-${tx.note}`)

        const isSpent = await instances[`${amount}${currency}`].service.findEvent({
          eventName: 'nullifierHash',
          eventToFind: nullifierHex,
          type: eventsType.WITHDRAWAL
        })

        if (isSpent) {
          commit('SET_SPENT', { txHash: tx.txHash, storeType: 'encryptedTxs', netId })
        }
      }
    }
  },
  checkPendingTransaction({ getters, dispatch }) {
    const transactions = getters.txs

    const pendingTxs = transactions.filter((tx) => tx.status === 1)

    for (const tx of pendingTxs) {
      const [, , , netId] = tx.prefix.split('-')

      dispatch('checkPendingSpeedUpTx', { txHash: tx.txHash, note: `${tx.prefix}-${tx.note}`, netId })
    }
  },
  async checkPendingSpeedUpTx({ commit, dispatch }, { txHash, netId, note }) {
    try {
      const result = await this.$provider.web3.eth.getTransactionReceipt(txHash)

      if (result) {
        const status = result.status === '0x0' ? txStatus.fail : txStatus.success

        commit('CHANGE_TX_STATUS', {
          storeType: 'txs',
          txHash,
          blockNumber: hexToNumber(result.blockNumber),
          status,
          netId
        })
      } else {
        const response = await dispatch(
          'application/loadDepositEvent',
          { withdrawNote: note },
          { root: true }
        )

        if (response) {
          commit('UPDATE_DEPOSIT', {
            netId,
            txHash,
            storeType: 'txs',
            status: txStatus.success,
            timestamp: response.timestamp,
            withdrawTxHash: response.txHash,
            blockNumber: response.depositBlock
          })
        }
      }
    } catch (err) {
      throw new Error(`Method checkPendingSpeedUpTx has error ${err.message}`)
    }
  },
  async runTxWatcher({ commit, dispatch }, { storeType = 'txs', txHash, netId, isSaving = true }) {
    console.log('runTxWatcher storeType txHash, netId', storeType, txHash, netId)
    try {
      // eslint-disable-next-line prefer-const
      let { status, blockNumber } = await this.$provider.waitForTxReceipt({ txHash })
      status = status === '0x0' ? txStatus.fail : txStatus.success

      if (isSaving) {
        commit('CHANGE_TX_STATUS', {
          storeType,
          txHash,
          blockNumber: hexToNumber(blockNumber),
          status,
          netId
        })
      }

      return status === txStatus.success
    } catch (e) {
      console.error('runTxWatcher', e)
      return false
    }
  },
  async runTxWatcherWithNotifications(
    { dispatch },
    { title, successTitle, storeType = 'txs', txHash, netId, onSuccess, isSaving }
  ) {
    try {
      const noticeId = await dispatch(
        'notice/addNotice',
        {
          notice: {
            title,
            type: 'loading',
            txHash
          }
        },
        { root: true }
      )
      const success = await dispatch('runTxWatcher', { storeType, txHash, netId, isSaving })
      if (success) {
        dispatch(
          'notice/updateNotice',
          {
            id: noticeId,
            notice: {
              title: successTitle,
              type: 'success'
            },
            interval: 10000
          },
          { root: true }
        )
        if (typeof onSuccess === 'function') {
          onSuccess(txHash)
        }
      } else {
        dispatch(
          'notice/updateNotice',
          {
            id: noticeId,
            notice: {
              title: 'transactionFailed',
              type: 'danger'
            }
          },
          { root: true }
        )
      }
      return success
    } catch (e) {
      console.error('runTxWatcherWithNotifications', e)
      return false
    }
  },
  async cleanTxs({ getters, commit, dispatch }) {
    // isSpentArray
    getters.txs.forEach(({ status, txHash, type }) => {
      if (status === txStatus.fail) {
        commit('DELETE_TX', { txHash })
      }
    })

    const instances = await dispatch('getInstances', {
      txs: getters.txs
    })

    for (const tx of getters.txs) {
      if (tx && !tx.isSpent) {
        const { currency, amount, netId, nullifierHex } = parseNote(`${tx.prefix}-${tx.note}`)

        const isSpent = await instances[`${amount}${currency}`].service.findEvent({
          eventName: 'nullifierHash',
          eventToFind: nullifierHex,
          type: eventsType.WITHDRAWAL
        })

        if (isSpent) {
          commit('SET_SPENT', { txHash: tx.txHash, netId })
        }
      }
    }
  },
  async updateDeposit(
    { getters, commit, dispatch, rootGetters },
    { netId, type = 'tornado', action = 'Withdraw', note, txHash, fee, amount, currency }
  ) {
    const timestamp = Math.round(new Date().getTime() / 1000)

    let txMutation = 'SAVE_TX_HASH'
    const tx = {
      txHash,
      type: action,
      amount,
      currency,
      fee,
      netId,
      timestamp,
      status: 2
    }

    if (type === 'tornado') {
      const [tornado, , , , hexNote] = note.split('-')
      const { commitmentHex } = parseNote(note)
      tx.prefix = `${tornado}-${currency}-${amount}-${netId}`
      tx.isSpent = true

      const encryptedTxs = getters.encryptedTxs
      const encrypted = encryptedTxs.find((tx) => {
        return tx.commitmentHex === commitmentHex
      })

      tx.storeType = encrypted ? 'encryptedTxs' : 'txs'

      const deposit =
        encrypted ||
        getters.txs.find(({ note }) => {
          return note === hexNote
        })

      tx.note = encrypted ? encrypted.note : hexNote

      const blockNumber = await dispatch('getBlockNumber', { txHash })
      tx.blockNumber = blockNumber

      if (deposit && deposit.txHash) {
        txMutation = 'UPDATE_DEPOSIT'
        tx.txHash = deposit.txHash
        tx.withdrawTxHash = txHash
      } else {
        const events = await dispatch('application/loadDepositEvent', { withdrawNote: note }, { root: true })

        tx.withdrawTxHash = txHash
        tx.txHash = events.txHash
        tx.depositBlock = events.depositBlock
        tx.index = events.leafIndex
      }
    }

    commit(txMutation, tx)
  },
  async getBlockNumber({ rootState }, { txHash }) {
    try {
      const { netId } = rootState.metamask
      const { url } = rootState.settings[`netId${netId}`].rpc

      const web3 = this.$provider.getWeb3(url)

      const { blockNumber } = await web3.eth.getTransaction(txHash)

      return blockNumber
    } catch (err) {
      console.log('getBlockNumber has error:', err.message)
    }
  }
}
