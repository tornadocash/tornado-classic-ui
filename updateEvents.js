const fs = require('fs')
const Web3 = require('web3')
const Jszip = require('jszip')
const networkConfig = require('./networkConfig')

const ABI = require('./abis/Instance.abi.json')

const EVENTS = ['Deposit', 'Withdrawal']
const CHAINS = [56]
const jszip = new Jszip()

async function download({ name, contentType }) {
  const path = `${name}.zip`

  const data = fs.readFileSync(path)
  const zip = await jszip.loadAsync(data)

  const file = zip.file(
    path
      .replace('./static/events/', '')
      .slice(0, -4)
      .toLowerCase()
  )

  const content = await file.async(contentType)

  return content
}

async function loadCachedEvents({ type, amount, nativeCurrency, deployedBlock }) {
  try {
    const module = await download({
      contentType: 'string',
      name: `./static/events/${type}s_${nativeCurrency}_${amount}.json`
    })

    if (module) {
      const events = JSON.parse(module)

      return {
        events,
        lastBlock: events[events.length - 1].blockNumber
      }
    }
  } catch (err) {
    console.error(`Method loadCachedEvents has error: ${err.message}`)
    return {
      events: [],
      lastBlock: deployedBlock
    }
  }
}

async function main(type, netId) {
  const { tokens, nativeCurrency, deployedBlock } = networkConfig[`netId${netId}`]
  const CONTRACTS = tokens[nativeCurrency].instanceAddress

  for (const [instance, _contract] of Object.entries(CONTRACTS)) {
    const cachedEvents = await loadCachedEvents({ type, amount: instance, nativeCurrency, deployedBlock })
    console.log('cachedEvents', cachedEvents.events.length)

    let startBlock = cachedEvents.lastBlock + 1
    console.log('startBlock', startBlock)

    const rpcUrl =
      netId === 1
        ? networkConfig[`netId${netId}`].rpcUrls.Infura.url
        : networkConfig[`netId${netId}`].rpcUrls.publicRpc3.url

    const provider = new Web3.providers.HttpProvider(rpcUrl)
    const web3 = new Web3(provider)

    const contract = new web3.eth.Contract(ABI, _contract)

    let events = []

    console.log(netId)
    if (netId === 56) {
      const blockRange = 4950
      const currentBlockNumber = await web3.eth.getBlockNumber()
      const blockDifference = Math.ceil(currentBlockNumber - startBlock)

      let numberParts = blockDifference === 0 ? 1 : Math.ceil(blockDifference / blockRange)
      const part = Math.ceil(blockDifference / numberParts)

      console.log('numberParts', numberParts)

      let toBlock = startBlock + part

      if (startBlock < currentBlockNumber) {
        if (toBlock >= currentBlockNumber) {
          toBlock = 'latest'
          numberParts = 1
        }

        for (let i = 0; i < numberParts; i++) {
          try {
            await new Promise((resolve) => setTimeout(resolve, 200))
            console.log({ startBlock, toBlock })
            const partOfEvents = await contract.getPastEvents(type, {
              fromBlock: startBlock,
              toBlock
            })

            if (partOfEvents) {
              events = events.concat(partOfEvents)
              console.log({
                events: events.length
              })
            }
            startBlock = toBlock
            toBlock += part
          } catch {
            numberParts = numberParts + 1
          }
        }
      }
    } else {
      events = await contract.getPastEvents(type, {
        fromBlock: startBlock,
        toBlock: 'latest'
      })
    }

    console.log('events', events.length)

    if (type === 'Deposit') {
      events = events.map(({ blockNumber, transactionHash, returnValues }) => {
        const { commitment, leafIndex, timestamp } = returnValues
        return {
          blockNumber,
          transactionHash,
          commitment,
          leafIndex: Number(leafIndex),
          timestamp
        }
      })
    }

    if (type === 'Withdrawal') {
      events = events.map(({ blockNumber, transactionHash, returnValues }) => {
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

    const eventsJson = JSON.stringify(cachedEvents.events.concat(events), null, 2) + '\n'
    fs.writeFileSync(`./static/events/${type.toLowerCase()}s_${nativeCurrency}_${instance}.json`, eventsJson)
  }
}

async function start() {
  for await (const chain of CHAINS) {
    for await (const event of EVENTS) {
      await main(event, chain)
    }
  }
}

start()
