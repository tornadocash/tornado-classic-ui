import { decrypt } from 'eth-sig-util'
import { isAddress } from 'web3-utils'

import { eventsType } from '@/constants'
import { parseHexNote, getInstanceByAddress, unpackEncryptedMessage } from '@/utils'

export async function _encryptFormatTx({ dispatch, getters, rootGetters }, { events, privateKey }) {
  let result = []

  const netId = rootGetters['metamask/netId']
  const eventsInterface = rootGetters['application/eventsInterface']

  dispatch('loading/changeText', { message: this.app.i18n.t('decryptingNotes') }, { root: true })

  const encryptedEvents = decryptEvents({ events, privateKey })

  dispatch(
    'loading/changeText',
    { message: this.app.i18n.t('getAndValidateEvents', { name: this.app.i18n.t('deposit') }) },
    { root: true }
  )

  const instances = encryptedEvents.reduce((acc, curr) => {
    const instance = getInstanceByAddress({ netId, address: curr.address })
    if (!instance) {
      return acc
    }
    const name = `${instance.amount}${instance.currency}`
    if (!acc[name]) {
      const service = eventsInterface.getService({ netId, ...instance })
      acc[name] = { ...instance, service }
    }
    return acc
  }, {})

  await Promise.all(
    [].concat(
      Object.values(instances).map((instance) => instance.service.updateEvents(eventsType.DEPOSIT)),
      Object.values(instances).map((instance) => instance.service.updateEvents(eventsType.WITHDRAWAL))
    )
  )

  const eventBatches = getBatches(encryptedEvents)

  for await (const batch of eventBatches) {
    try {
      const depositPromises = batch.map((event) => {
        const instance = getInstanceByAddress({ netId, address: event.address })
        if (!instance) {
          return
        }
        const { service } = instances[`${instance.amount}${instance.currency}`]
        return getDeposit({ event, netId, service, instance })
      })

      const proceedDeposits = await Promise.all(depositPromises)
      console.log({ proceedDeposits })

      dispatch(
        'loading/changeText',
        { message: this.app.i18n.t('getAndValidateEvents', { name: this.app.i18n.t('withdrawal') }) },
        { root: true }
      )

      const proceedEvents = await Promise.all(
        proceedDeposits.map(([event, deposit]) => proceedEvent({ event, getters, deposit, netId, dispatch }))
      )

      result = result.concat(proceedEvents)
    } catch (e) {
      console.error('_encryptFormatTx', e)
    }
  }

  return formattingEvents(result)
}

function decryptEvents({ privateKey, events }) {
  const encryptEvents = []

  for (const event of events) {
    try {
      const unpackedMessage = unpackEncryptedMessage(event.encryptedNote)

      const [address, note] = decrypt(unpackedMessage, privateKey).split('-')
      encryptEvents.push({ address, note, ...event })
    } catch {
      // decryption may fail for foreign notes
      continue
    }
  }

  return encryptEvents
}

function formattingEvents(proceedEvents) {
  const result = []
  const statistic = []
  let unSpent = 0

  proceedEvents.forEach((transaction) => {
    if (transaction) {
      if (!transaction.isSpent) {
        unSpent += 1
        statistic.push({
          amount: transaction.amount,
          currency: transaction.currency
        })
      }

      result.push(transaction)
    }
  })

  return {
    unSpent,
    statistic,
    transactions: result
  }
}

async function getDeposit({ netId, event, service, instance }) {
  const { commitmentHex, nullifierHex } = parseHexNote(event.note)

  const foundEvent = await service.findEvent({
    eventName: 'commitment',
    eventToFind: commitmentHex,
    type: eventsType.DEPOSIT
  })

  if (!foundEvent) {
    return
  }

  const isSpent = await service.findEvent({
    eventName: 'nullifierHash',
    eventToFind: nullifierHex,
    type: eventsType.WITHDRAWAL
  })

  const deposit = {
    leafIndex: foundEvent.leafIndex,
    timestamp: foundEvent.timestamp,
    txHash: foundEvent.transactionHash,
    depositBlock: foundEvent.blockNumber
  }

  return [
    event,
    {
      nullifierHex,
      commitmentHex,
      amount: instance.amount,
      isSpent: Boolean(isSpent),
      currency: instance.currency,
      prefix: `tornado-${instance.currency}-${instance.amount}-${netId}`,
      ...deposit
    }
  ]
}

async function proceedEvent({ dispatch, getters, deposit, netId, event: { note, address, ...event } }) {
  const { encrypt, backup } = getters.accounts

  try {
    const { depositBlock, ...rest } = deposit

    const transaction = {
      ...rest,
      netId,
      status: 2,
      type: 'Deposit',
      txHash: event.txHash,
      owner: isAddress(encrypt) ? encrypt : '',
      backupAccount: isAddress(backup) ? backup : '',
      index: deposit.leafIndex,
      storeType: 'encryptedTxs',
      blockNumber: event.blockNumber,
      note: event.encryptedNote
    }

    if (deposit && deposit.isSpent) {
      const withdrawEvent = await dispatch(
        'application/loadWithdrawalEvent',
        { withdrawNote: `${deposit.prefix}-${note}` },
        { root: true }
      )
      if (withdrawEvent) {
        transaction.txHash = withdrawEvent.txHash
        transaction.depositBlock = depositBlock
        transaction.blockNumber = withdrawEvent.blockNumber
      }
    }

    return transaction
  } catch (err) {
    console.log('err', err.message)
  }
}

function getBatches(arr, batchSize = 100) {
  const batches = []
  while (arr.length) {
    batches.push(arr.splice(0, batchSize))
  }
  return batches
}
