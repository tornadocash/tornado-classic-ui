import networkConfig from '@/networkConfig'

export function getInstanceByAddress({ netId, address }) {
  const { tokens } = networkConfig[`netId${netId}`]

  for (const [currency, { instanceAddress }] of Object.entries(tokens)) {
    for (const [amount, instance] of Object.entries(instanceAddress)) {
      if (instance === address) {
        return {
          amount,
          currency
        }
      }
    }
  }
}
