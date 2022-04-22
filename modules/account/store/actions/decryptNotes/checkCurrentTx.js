export function _checkCurrentTx({ rootGetters }, transactions) {
  const currentTransactions = rootGetters['txHashKeeper/allTxsHash']
  const newTransactions = transactions.filter((event) => !currentTransactions.includes(event.txHash))

  return newTransactions
}
