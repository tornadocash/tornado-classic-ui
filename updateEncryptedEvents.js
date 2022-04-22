const fs = require('fs')
const Web3 = require('web3')
const Jszip = require('jszip')
const networkConfig = require('./networkConfig')

const MAIN_NET_RPC_URL = networkConfig.netId1.rpcUrls.Infura.url
const GOERLI_RPC_URL = networkConfig.netId5.rpcUrls.Alchemy.url
const ABI = require('./abis/TornadoProxy.abi.json')

const jszip = new Jszip()

function getWeb3(netId) {
  const rpc = Number(netId) === 1 ? MAIN_NET_RPC_URL : GOERLI_RPC_URL
  const provider = new Web3.providers.HttpProvider(rpc)
  const web3 = new Web3(provider)

  return web3
}

async function download({ name, contentType }) {
  const path = `${name}.zip`

  const data = fs.readFileSync(path)
  const zip = await jszip.loadAsync(data)
  const file = zip.file(path.replace('./static/events/', '').slice(0, -4))

  const content = await file.async(contentType)

  return content
}

async function loadCachedEvents(file) {
  try {
    const module = await download({
      contentType: 'string',
      name: file
    })

    if (module) {
      const events = JSON.parse(module)

      const lastEvent = events[events.length - 1]
      const lastBlock = lastEvent.block || lastEvent.blockNumber

      return {
        events,
        lastBlock
      }
    }
  } catch (err) {
    throw new Error(`Method loadCachedEvents has error: ${err.message}`)
  }
}

async function saveEncryptedNote(netId) {
  const web3 = getWeb3(netId)

  const {
    'tornado-proxy.contract.tornadocash.eth': tornadoProxy,
    'tornado-router.contract.tornadocash.eth': tornadoRouter
  } = networkConfig[`netId${netId}`]

  const contractAddress = tornadoRouter || tornadoProxy

  const contract = new web3.eth.Contract(ABI, contractAddress)
  const currentBlockNumber = await web3.eth.getBlockNumber()

  const file = `./static/events/encrypted_notes_${netId}.json`

  let encryptedEvents = []

  const cachedEvents = await loadCachedEvents(file)
  console.log('cachedEvents', cachedEvents.events.length)

  const startBlock = cachedEvents.lastBlock + 1

  const NUMBER_PARTS = 20
  const part = parseInt((currentBlockNumber - startBlock) / NUMBER_PARTS)

  let fromBlock = startBlock
  let toBlock = startBlock + part

  for (let i = 0; i <= NUMBER_PARTS; i++) {
    const partOfEvents = await contract.getPastEvents('EncryptedNote', {
      toBlock,
      fromBlock
    })
    if (partOfEvents) {
      encryptedEvents = encryptedEvents.concat(partOfEvents)
    }
    fromBlock = toBlock
    toBlock += part
  }

  console.log('Encrypted note', netId, encryptedEvents.length)

  encryptedEvents = encryptedEvents
    .filter((e) => e.returnValues.encryptedNote)
    .map((item) => {
      return {
        txHash: item.transactionHash,
        blockNumber: Number(item.blockNumber),
        encryptedNote: item.returnValues.encryptedNote
      }
    })

  const eventsJson = JSON.stringify(cachedEvents.events.concat(encryptedEvents), null, 2) + '\n'
  fs.writeFileSync(file, eventsJson)
}

async function main() {
  const NETWORKS = [1]

  for await (const netId of NETWORKS) {
    await saveEncryptedNote(netId)
  }
}

main()
