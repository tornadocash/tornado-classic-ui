import { MerkleTree, PartialMerkleTree } from 'fixed-merkle-tree'

import { trees } from '@/constants'
import { download } from '@/store/snark'
import networkConfig from '@/networkConfig'
import { mimc, bloomService } from '@/services'

class MerkleTreeService {
  constructor({ netId, amount, currency, commitment, instanceName }) {
    this.netId = netId
    this.amount = amount
    this.currency = currency
    this.commitment = commitment
    this.instanceName = instanceName

    this.idb = window.$nuxt.$indexedDB(netId)
    this.bloomService = bloomService({
      netId,
      amount,
      commitment,
      instanceName,
      fileFolder: 'trees',
      fileName: `deposits_${currency}_${amount}_bloom.json.zip`
    })
  }

  getFileName(partNumber = trees.PARTS_COUNT) {
    return `trees/deposits_${this.currency}_${this.amount}_slice${partNumber}.json.zip`
  }

  createTree({ events }) {
    const { merkleTreeHeight, emptyElement } = networkConfig[`netId${this.netId}`]

    return new MerkleTree(merkleTreeHeight, events, {
      zeroElement: emptyElement,
      hashFunction: mimc.hash
    })
  }

  async downloadEdge(name) {
    const slicedEdge = await download({
      name,
      eventName: 'trees',
      contentType: 'string'
    })

    if (!slicedEdge) {
      throw new Error('Cant download file')
    }

    return JSON.parse(slicedEdge)
  }

  createPartialTree({ edge, elements }) {
    const { emptyElement } = networkConfig[`netId${this.netId}`]

    return new PartialMerkleTree(trees.LEVELS, edge, elements, {
      zeroElement: emptyElement,
      hashFunction: mimc.hash
    })
  }

  async getTreeFromCache() {
    try {
      const initialEdge = await this.downloadEdge(this.getFileName())

      const partialTree = this.createPartialTree(initialEdge)

      if (initialEdge.elements.includes(this.commitment)) {
        return partialTree
      }

      const isCacheHasCommitment = await this.bloomService.checkBloom()

      if (!isCacheHasCommitment) {
        return partialTree
      }

      let edge
      let elements = []

      for (let i = trees.PARTS_COUNT - 1; i > 0; i--) {
        const slicedEdge = await this.downloadEdge(this.getFileName(i))

        edge = slicedEdge.edge
        elements = [].concat(slicedEdge.elements, elements)

        if (slicedEdge.elements.includes(this.commitment)) {
          break
        }
      }

      partialTree.shiftEdge(edge, elements)

      return partialTree
    } catch (err) {
      return undefined
    }
  }

  async getTreeFromDB() {
    try {
      const stringifyCachedTree = await this.idb.getAll({
        storeName: `stringify_tree_${this.instanceName}`
      })

      if (!stringifyCachedTree || !stringifyCachedTree.length) {
        return undefined
      }

      const [{ tree }] = stringifyCachedTree
      const parsedTree = JSON.parse(tree)
      const isPartial = '_edgeLeaf' in parsedTree

      const savedTree = isPartial
        ? PartialMerkleTree.deserialize(parsedTree, mimc.hash)
        : MerkleTree.deserialize(parsedTree, mimc.hash)

      if (isPartial) {
        const edgeIndex = savedTree.edgeIndex
        const indexOfEvent = savedTree.indexOf(this.commitment)

        // ToDo save edges mapping { edgeIndex, edgeSlice }
        if (indexOfEvent === -1 && edgeIndex !== 0) {
          const isCacheHasCommitment = await this.bloomService.checkBloom()

          if (isCacheHasCommitment) {
            let edge
            let elements = []

            for (let i = trees.PARTS_COUNT; i > 0; i--) {
              const slicedEdge = await this.downloadEdge(this.getFileName(i))

              if (edgeIndex > slicedEdge.edge.edgeIndex) {
                edge = slicedEdge.edge
                elements = [].concat(slicedEdge.elements, elements)
              }

              if (slicedEdge.elements.includes(this.commitment)) {
                break
              }
            }

            savedTree.shiftEdge(edge, elements)
          }
        }
      }

      return savedTree
    } catch (err) {
      return undefined
    }
  }

  async getTree() {
    const { nativeCurrency } = networkConfig[`netId${this.netId}`]
    const hasCache = nativeCurrency === this.currency && Number(this.netId) === 1

    let cachedTree = await this.getTreeFromDB()

    if (!cachedTree && hasCache) {
      cachedTree = await this.getTreeFromCache()
    }
    return cachedTree
  }

  async saveTree({ tree }) {
    try {
      await this.idb.putItem({
        storeName: `stringify_tree_${this.instanceName}`,
        data: {
          hashTree: '1', // need for replace tree
          tree: tree.toString()
        },
        key: 'hashTree'
      })
    } catch (err) {
      console.error('saveCachedTree has error:', err.message)
    }
  }
}

class TreesFactory {
  instances = new Map()

  getService = (payload) => {
    const instanceName = `${payload.currency}_${payload.amount}`
    if (this.instances.has(instanceName)) {
      return this.instances.get(instanceName)
    }

    const instance = new MerkleTreeService(payload)
    this.instances.set(instanceName, instance)
    return instance
  }
}

export const treesInterface = new TreesFactory()
