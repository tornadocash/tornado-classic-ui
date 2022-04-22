import { openDB, deleteDB } from 'idb'

import networkConfig from '@/networkConfig'
import { INDEX_DB_ERROR, NETWORKS } from '@/constants'

// TODO method for migration, remove indexed
class IndexedDB {
  constructor({ stores, dbName }) {
    this.dbExists = false
    this.isBlocked = false

    this.options = {
      upgrade(db) {
        Object.values(db.objectStoreNames).forEach((value) => {
          db.deleteObjectStore(value)
        })

        stores.forEach(({ name, keyPath, indexes }) => {
          const store = db.createObjectStore(name, {
            keyPath,
            autoIncrement: true
          })

          if (Array.isArray(indexes)) {
            indexes.forEach(({ name, unique = false }) => {
              store.createIndex(name, name, { unique })
            })
          }
        })
      }
    }

    this.dbName = dbName
  }

  async initDB() {
    try {
      if (this.dbExists) {
        return
      }

      this.db = await openDB(this.dbName, 31, this.options) // version (optional): Schema version, or undefined to open the current version.
      this.onEventHandler()

      this.dbExists = true
    } catch (err) {
      // need for private mode firefox browser
      if (err.message.includes(INDEX_DB_ERROR)) {
        this.isBlocked = true
        return
      }

      if (err.message.includes('less than the existing version')) {
        await this._removeExist()
      }

      console.error(`Method initDB has error: ${err.message}`)
    }
  }

  onEventHandler() {
    this.db.addEventListener('onupgradeneeded', async () => {
      await this._removeExist()
    })
  }

  async _removeExist() {
    await deleteDB(this.dbName)
    this.dbExists = false

    await this.initDB()
  }

  async getFromIndex(params) {
    if (this.isBlocked) {
      return
    }

    try {
      return await this._getFromIndex(params)
    } catch (err) {
      return undefined
    }
  }

  async _getFromIndex({ storeName, indexName, key }) {
    try {
      const value = await this.db.getFromIndex(storeName, indexName, key)
      return value
    } catch (err) {
      throw new Error(`Method getFromIndex has error: ${err.message}`)
    }
  }

  async getAllFromIndex(params) {
    if (this.isBlocked) {
      return []
    }

    try {
      return await this._getAllFromIndex(params)
    } catch (err) {
      return []
    }
  }

  async _getAllFromIndex({ storeName, indexName, key, count }) {
    try {
      const value = await this.db.getAllFromIndex(storeName, indexName, key, count)
      return value
    } catch (err) {
      throw new Error(`Method getAllFromIndex has error: ${err.message}`)
    }
  }

  async getItem({ storeName, key }) {
    try {
      const store = this.db.transaction(storeName).objectStore(storeName)

      const value = await store.get(key)
      return value
    } catch (err) {
      throw new Error(`Method getItem has error: ${err.message}`)
    }
  }

  async addItem({ storeName, data, key = '' }) {
    try {
      const tx = this.db.transaction(storeName, 'readwrite')
      const isExist = await tx.objectStore(storeName).get(key)

      if (!isExist) {
        await tx.objectStore(storeName).add(data)
      }
    } catch (err) {
      throw new Error(`Method addItem has error: ${err.message}`)
    }
  }

  async putItem({ storeName, data }) {
    try {
      const tx = this.db.transaction(storeName, 'readwrite')
      await tx.objectStore(storeName).put(data)
    } catch (err) {
      throw new Error(`Method putItem has error: ${err.message}`)
    }
  }

  async getAll({ storeName }) {
    try {
      const tx = this.db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)

      const data = await store.getAll()
      return data
    } catch (err) {
      throw new Error(`Method getAll has error: ${err.message}`)
    }
  }

  async clearStore({ storeName, mode = 'readwrite' }) {
    try {
      const tx = this.db.transaction(storeName, mode)

      await tx.objectStore(storeName).clear()
    } catch (err) {
      throw new Error(`Method clearStore has error: ${err.message}`)
    }
  }

  async createTransactions({ storeName, data, mode = 'readwrite' }) {
    try {
      const tx = this.db.transaction(storeName, mode)

      await tx.objectStore(storeName).add(data)
      await tx.done
    } catch (err) {
      throw new Error(`Method createTransactions has error: ${err.message}`)
    }
  }

  createMultipleTransactions({ storeName, data, index, mode = 'readwrite' }) {
    try {
      const tx = this.db.transaction(storeName, mode)

      data.map((item) => {
        if (item) {
          tx.store.put({ ...item, ...index })
        }
      })
    } catch (err) {
      throw new Error(`Method createMultipleTransactions has error: ${err.message}`)
    }
  }
}

export default async (ctx, inject) => {
  const DEPOSIT_INDEXES = [
    { name: 'instance', unique: false },
    { name: 'transactionHash', unique: false },
    { name: 'commitment', unique: true }
  ]
  const WITHDRAWAL_INDEXES = [
    { name: 'instance', unique: false },
    { name: 'nullifierHash', unique: true } // keys on which the index is created
  ]
  const LAST_EVENT_INDEXES = [{ name: 'name', unique: false }]

  // TODO: generate from config
  const defaultState = [
    {
      name: 'encrypted_events',
      keyPath: 'transactionHash'
    },
    {
      name: 'withdrawals',
      keyPath: 'transactionHash',
      indexes: WITHDRAWAL_INDEXES
    },
    {
      name: 'lastEvents',
      keyPath: 'name',
      indexes: LAST_EVENT_INDEXES
    }
  ]

  const stores = [
    {
      name: 'register_events',
      keyPath: 'ensName'
    }
  ]

  NETWORKS.forEach((netId) => {
    defaultState.map((item) => {
      stores.push({
        ...item,
        name: `${item.name}_${netId}`
      })
    })
  })

  Object.keys(networkConfig).forEach((key) => {
    const { tokens, nativeCurrency } = networkConfig[key]

    const netId = key.replace('netId', '')

    Object.keys(tokens).forEach((token) => {
      Object.keys(tokens[token].instanceAddress).forEach((amount) => {
        if (nativeCurrency === token) {
          // ToDo make good)
          stores.push({
            name: `stringify_bloom_${token}_${amount}_${netId}`,
            keyPath: 'hashBloom'
          })
        }

        stores.push({
          name: `deposits_${token}_${amount}_${netId}`,
          keyPath: 'leafIndex', // the key by which it refers to the object must be in all instances of the storage
          indexes: DEPOSIT_INDEXES
        })

        stores.push({
          name: `stringify_tree_${token}_${amount}_${netId}`,
          keyPath: 'hashTree'
        })
      })
    })
  })

  const options = {
    stores,
    dbName: 'tornado_cash'
  }

  const instance = new IndexedDB(options)

  await instance.initDB()

  ctx.$indexedDB = instance
  inject('indexedDB', instance)
}
