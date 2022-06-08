import 'dotenv/config'

import fs from 'fs'
import BloomFilter from 'bloomfilter.js'
import { MerkleTree } from 'fixed-merkle-tree'
import { buildMimcSponge } from 'circomlibjs'

import networkConfig from '../networkConfig'

import { loadCachedEvents, save } from './helpers'

const TREES_FOLDER = 'static/trees'
const TREES_PATH = './static/trees/'
const EVENTS_PATH = './static/events/'

const EVENTS = ['deposit']
const enabledChains = ['1']
let mimcHash

const trees = {
  PARTS_COUNT: 4,
  LEVELS: 20 // const from contract
}

function getName({ path, type, instance, format = '.json', currName = 'eth' }) {
  return `${path}${type.toLowerCase()}s_${currName}_${instance}${format}`
}

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
          path: TREES_PATH,
          currName: config.currencyName.toLowerCase()
        })

        const treesFolder = fs.readdirSync(TREES_FOLDER)

        treesFolder.forEach((fileName) => {
          fileName = `${TREES_PATH}${fileName}`
          const isInstanceFile = !fileName.includes('.zip') && fileName.includes(baseFilename)

          if (isInstanceFile) {
            save(fileName)
          }
        })
      }
    }
  } catch {}
}

async function createTree(netId) {
  try {
    const { currencyName, tokens, deployedBlock } = networkConfig[`netId${netId}`]

    const currName = currencyName.toLowerCase()
    const { instanceAddress: CONTRACTS } = tokens.eth

    for (const type of EVENTS) {
      for (const [instance] of Object.entries(CONTRACTS)) {
        const filePath = getName({
          type,
          instance,
          currName,
          format: '',
          path: TREES_PATH
        })

        console.log('createTree', { type, instance })

        const { events } = await loadCachedEvents({
          name: `${type}s_${currName}_${instance}.json`,
          directory: EVENTS_PATH,
          deployedBlock
        })

        console.log('events', events.length)

        const bloom = new BloomFilter(events.length) // to reduce the number of false positives

        const eventsData = events.reduce(
          (acc, { leafIndex, commitment, ...rest }, i) => {
            if (leafIndex !== i) {
              throw new Error(`leafIndex (${leafIndex}) !== i (${i})`)
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
    console.error(e.message)
  }
}

async function initMimc() {
  const mimcSponge = await buildMimcSponge()
  mimcHash = (left, right) => mimcSponge.F.toString(mimcSponge.multiHash([BigInt(left), BigInt(right)]))
}

async function main() {
  const [, , , chain] = process.argv
  if (!enabledChains.includes(chain)) {
    throw new Error(`Supported chain ids ${enabledChains.join(', ')}`)
  }
  await initMimc()

  await createTree(chain)
  await createTreeZip(chain)
}

main()
