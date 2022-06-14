export const GET_STATISTIC = `
  query getStatistic($currency: String!, $amount: String!, $first: Int, $orderBy: BigInt, $orderDirection: String) {
    deposits(first: $first, orderBy: $orderBy, orderDirection: $orderDirection, where: { currency: $currency, amount: $amount }) {
      index
      timestamp
      blockNumber
    }  
  }
`

export const GET_WITHDRAWALS = `
  query getWithdrawals($currency: String!, $amount: String!, $first: Int, $fromBlock: Int!) {
    withdrawals(first: $first, orderBy: blockNumber, orderDirection: asc,
      where: { 
        currency: $currency,
        amount: $amount,
        blockNumber_gte: $fromBlock
      }) {
        to
        fee
        nullifier
        timestamp
        blockNumber
        transactionHash
      }
  }
`

export const GET_REGISTERED = `
  query getDeposits($first: Int, $fromBlock: Int) {
      relayers(first: $first, where: {
        blockRegistration_gte: $fromBlock
      }) {
       address
       ensName
       ensHash
       blockRegistration
    }
  }
`

export const GET_DEPOSITS = `
  query getDeposits($currency: String!, $amount: String!, $first: Int, $fromBlock: Int) {
    deposits(first: $first, orderBy: index, orderDirection: asc, where: { 
      amount: $amount,
      currency: $currency,
      blockNumber_gte: $fromBlock
    }) {
      index
      timestamp
      commitment
      blockNumber
      transactionHash
    }
  }
`

export const GET_NOTE_ACCOUNTS = `
  query getNoteAccount($address: String!) {
    noteAccounts(where: { address: $address }) {
      id
      index
      address
      encryptedAccount
    }
  }
`

export const GET_ENCRYPTED_NOTES = `
  query getEncryptedNotes($first: Int, $fromBlock: Int) {
    encryptedNotes(first: $first, orderBy: blockNumber, orderDirection: asc, where: { blockNumber_gte: $fromBlock }) {
      id
      index
      blockNumber
      encryptedNote
      transactionHash
    }
  }
`

export const _META = `
  query getMeta {
    _meta {
      block {
        number
      }
    }
  }
`
