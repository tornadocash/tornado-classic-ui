import BloomFilter from 'bloomfilter.js'

import { download } from '@/store/snark'

class BloomService {
  constructor({ netId, amount, commitment, instanceName, fileName, fileFolder }) {
    this.amount = amount
    this.fileFolder = fileFolder
    this.commitment = commitment
    this.instanceName = instanceName
    this.fileName = `${fileFolder}/${fileName}`

    this.idb = window.$nuxt.$indexedDB(netId)
  }

  async downloadBloom() {
    const cachedBloom = await download({
      name: this.fileName,
      contentType: 'string',
      eventName: this.fileFolder
    })

    if (!cachedBloom) {
      throw new Error('Cant download file')
    }

    return BloomFilter.deserialize(cachedBloom)
  }

  async getBloomFromDB() {
    try {
      const stringifyCachedBloom = await this.idb.getAll({
        storeName: `stringify_bloom_${this.instanceName}`
      })

      if (!stringifyCachedBloom || !stringifyCachedBloom.length) {
        return undefined
      }

      const [{ tree }] = stringifyCachedBloom

      return BloomFilter.deserialize(tree)
    } catch (err) {
      return undefined
    }
  }

  async getBloomFromCache() {
    try {
      const bloom = await this.downloadBloom()
      await this.saveBloom({ bloom })

      return bloom
    } catch (err) {
      return false
    }
  }

  async checkBloom() {
    let cachedBloom = await this.getBloomFromDB()
    if (!cachedBloom) {
      cachedBloom = await this.getBloomFromCache()
    }
    return cachedBloom.test(this.commitment)
  }

  async saveBloom({ bloom }) {
    try {
      await this.idb.putItem({
        storeName: `stringify_bloom_${this.instanceName}`,
        data: {
          hashBloom: '1', // need for replace bloom
          tree: bloom.serialize()
        },
        key: 'hashBloom'
      })
    } catch (err) {
      console.error('saveBloom has error:', err.message)
    }
  }
}

export const bloomService = (payload) => new BloomService(payload)
