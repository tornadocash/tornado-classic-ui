const fs = require('fs')
const Jszip = require('jszip')
const zipper = require('zip-local')
const BloomFilter = require('bloomfilter.js')

const jszip = new Jszip()
const EVENTS = ['deposit']

const { MerkleTree } = require('fixed-merkle-tree')
const { buildMimcSponge } = require('circomlibjs')

const networkConfig = require('./networkConfig')

const treesPath = './static/trees/'
const eventsPath = './static/events/'

let mimcHash

const trees = {
  PARTS_COUNT: 4,
  LEVELS: 20 // const from contract
}

function getName({ path, type, instance, format = '.json', currName = 'eth' }) {
  return `${path}${type.toLowerCase()}s_${currName}_${instance}${format}`
}

const TREES_FOLDER = 'static/trees'
function createTreeZip(netId) {
  try {
    const config = networkConfig[`netId${netId}`]
    const { instanceAddress: CONTRACTS } = config.tokens.eth

    for (const type of EVENTS) {
      for (const [instance] of Object.entries(CONTRACTS)) {
        const baseFilename = getName({
          type,
          instance,
          format: '',
          path: treesPath,
          currName: config.currencyName.toLowerCase()
        })

        const treesFolder = fs.readdirSync(TREES_FOLDER)

        treesFolder.forEach((fileName) => {
          fileName = `${treesPath}${fileName}`
          const isInstanceFile = !fileName.includes('.zip') && fileName.includes(baseFilename)

          if (isInstanceFile) {
            zipper.sync
              .zip(`${fileName}`)
              .compress()
              .save(`${fileName}.zip`)

            fs.unlinkSync(fileName)
          }
        })
      }
    }
  } catch {}
}

async function createTree(netId) {
  try {
    const config = networkConfig[`netId${netId}`]

    const currName = config.currencyName.toLowerCase()
    const { instanceAddress: CONTRACTS } = config.tokens.eth

    for (const type of EVENTS) {
      for (const [instance] of Object.entries(CONTRACTS)) {
        const filePath = getName({
          type,
          instance,
          currName,
          format: '',
          path: treesPath
        })

        console.log('createTree', { type, instance })

        const events = await loadCachedEvents({ type, amount: instance, currName })
        console.log('events', events.length)

        const bloom = new BloomFilter(events.length) // to reduce the number of false positives

        const eventsData = events.reduce(
          (acc, { leafIndex, commitment, ...rest }, i) => {
            if (leafIndex !== i) {
              throw new Error('leafIndex !== i', i, leafIndex)
            }

            const leave = commitment.toString()
            acc.leaves.push(leave)
            acc.metadata[leave] = { ...rest, leafIndex }

            return acc
          },
          { leaves: [], metadata: {} }
        )

        console.log('leaves', eventsData.leaves.length)

        const tree = new MerkleTree(trees.LEVELS, eventsData.leaves, {
          zeroElement: '21663839004416932945382355908790599225266501822907911457504978515578255421292',
          hashFunction: mimcHash
        })

        const slices = tree.getTreeSlices(trees.PARTS_COUNT) // [edge(PARTS_COUNT)]

        slices.forEach((slice, index) => {
          slice.metadata = slice.elements.reduce((acc, curr) => {
            if (index < trees.PARTS_COUNT - 1) {
              bloom.add(curr)
            }
            acc.push(eventsData.metadata[curr])
            return acc
          }, [])

          const sliceJson = JSON.stringify(slice, null, 2) + '\n'
          fs.writeFileSync(`${filePath}_slice${index + 1}.json`, sliceJson)
        })

        const bloomCache = bloom.serialize()
        fs.writeFileSync(`${filePath}_bloom.json`, bloomCache)
      }
    }
  } catch (e) {
    console.log(e.message)
  }
}

async function download({ name, contentType }) {
  const path = `${name}.zip`

  const data = fs.readFileSync(path)
  const zip = await jszip.loadAsync(data)

  const file = zip.file(
    path
      .replace(eventsPath, '')
      .slice(0, -4)
      .toLowerCase()
  )

  const content = await file.async(contentType)

  return content
}

async function loadCachedEvents({ type, amount, currName = 'eth', path = '' }) {
  try {
    const module = await download({
      contentType: 'string',
      name: path || getName({ path: eventsPath, type, instance: amount, currName })
    })

    if (module) {
      return JSON.parse(module)
    }
  } catch (err) {
    throw new Error(`Method loadCachedEvents has error: ${err.message}`)
  }
}

async function initMimc() {
  const mimcSponge = await buildMimcSponge()
  mimcHash = (left, right) => mimcSponge.F.toString(mimcSponge.multiHash([BigInt(left), BigInt(right)]))
}

async function main() {
  await initMimc()

  const NETWORKS = [1]

  for await (const netId of NETWORKS) {
    await createTree(netId)
    await createTreeZip(netId)
  }
}

main()
