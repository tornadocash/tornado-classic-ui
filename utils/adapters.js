import { eventsType } from '@/constants'

export function formatEvents(events, type) {
  if (type === eventsType.DEPOSIT) {
    return events.map(({ blockNumber, transactionHash, returnValues }) => {
      const { commitment, leafIndex, timestamp } = returnValues
      return {
        blockNumber,
        transactionHash,
        commitment,
        leafIndex: Number(leafIndex),
        timestamp
      }
    })
  } else {
    return events.map(({ blockNumber, transactionHash, returnValues }) => {
      const { nullifierHash, to, fee } = returnValues
      return {
        blockNumber,
        transactionHash,
        nullifierHash,
        to,
        fee
      }
    })
  }
}

export function formatEvent(event, type) {
  if (type === eventsType.DEPOSIT) {
    return {
      timestamp: event.timestamp,
      commitment: event.commitment,
      leafIndex: Number(event.index ? event.index : event.leafIndex),
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash
    }
  } else {
    return {
      to: event.to,
      fee: event.fee,
      nullifierHash: event.nullifier ? event.nullifier : event.nullifierHash,
      blockNumber: Number(event.blockNumber),
      transactionHash: event.transactionHash
    }
  }
}
