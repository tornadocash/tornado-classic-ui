const fs = require('fs')
const Jszip = require('jszip')
const zipper = require('zip-local')

const jszip = new Jszip()
const EVENTS = ['Deposit', 'Withdrawal']

const networkConfig = require('./networkConfig')

function updateEncryptedNote(netId) {
  try {
    const file = `./static/events/encrypted_notes_${netId}.json`
    zipper.sync
      .zip(file)
      .compress()
      .save(`${file}.zip`)
    fs.unlinkSync(file)
  } catch {}
}

function updateCommon(netId) {
  try {
    const CURRENCY = networkConfig[`netId${netId}`].nativeCurrency
    const CONTRACTS = networkConfig[`netId${netId}`].tokens[CURRENCY].instanceAddress

    for (const type of EVENTS) {
      for (const [instance] of Object.entries(CONTRACTS)) {
        const file = `./static/events/${type.toLowerCase()}s_${CURRENCY}_${instance}.json`

        zipper.sync
          .zip(file)
          .compress()
          .save(`${file}.zip`)

        fs.unlinkSync(file)
      }
    }
  } catch {}
}

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

async function loadCachedEvents({ type, amount, CURRENCY, path = '' }) {
  try {
    const module = await download({
      contentType: 'string',
      name: path || `./static/events/${type}s_${CURRENCY}_${amount}.json`
    })

    if (module) {
      const events = JSON.parse(module)

      return {
        events,
        lastBlock: events[events.length - 1].blockNumber
      }
    }
  } catch (err) {
    throw new Error(`Method loadCachedEvents has error: ${err.message}`)
  }
}

async function testCommon(netId) {
  for (const type of EVENTS) {
    if (type === 'Withdrawal') {
      return
    }

    const CURRENCY = networkConfig[`netId${netId}`].nativeCurrency
    const CONTRACTS = networkConfig[`netId${netId}`].tokens[CURRENCY].instanceAddress

    for (const [instance, _contract] of Object.entries(CONTRACTS)) {
      console.log('update', { type, instance, contract: _contract })

      const cachedEvents = await loadCachedEvents({ type, amount: instance, CURRENCY })
      console.log('cachedEvents', cachedEvents.events.length)

      cachedEvents.events.forEach((e, index) => {
        if (Number(e.leafIndex) !== index) {
          throw new Error(index)
        }
      })
    }
  }
}

async function main() {
  const NETWORKS = [1, 5, 56]

  for await (const netId of NETWORKS) {
    await updateEncryptedNote(netId)
    await updateCommon(netId)
    await testCommon(netId)
  }
}

main()
