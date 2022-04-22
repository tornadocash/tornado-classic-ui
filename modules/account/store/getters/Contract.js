import Web3 from 'web3'

const ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'who', type: 'address' },
      { indexed: false, internalType: 'bytes', name: 'data', type: 'bytes' }
    ],
    name: 'Echo',
    type: 'event'
  },
  {
    inputs: [{ internalType: 'bytes', name: '_data', type: 'bytes' }],
    name: 'echo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

export class EchoContract {
  constructor({ rpcUrl, address }) {
    this.web3 = new Web3(rpcUrl)

    this.contract = new this.web3.eth.Contract(ABI, address)
    this.address = this.contract._address
  }

  async getEvents({ address, fromBlock = 0, toBlock = 'latest' }) {
    try {
      return await this.contract.getPastEvents('Echo', {
        toBlock,
        fromBlock,
        filter: { who: address }
      })
    } catch (err) {
      throw new Error(`Method getEvents has error: ${err.message}`)
    }
  }

  async estimateGas({ from, data }) {
    try {
      return await this.contract.methods.echo(data).estimateGas({ from })
    } catch (err) {
      throw new Error(`Method estimateGas has error: ${err.message}`)
    }
  }

  getCallData(data) {
    try {
      return this.contract.methods.echo(data).encodeABI()
    } catch (err) {
      throw new Error(`Method getCallData has error: ${err.message}`)
    }
  }
}
