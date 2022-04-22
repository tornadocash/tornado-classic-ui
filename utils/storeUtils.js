import { cloneDeep } from 'lodash'
import { CHAIN_IDS } from '@/constants'

const netIdWrapper = (initialState) => (acc, netId) => ({
  ...acc,
  [netId]: Object.assign({}, cloneDeep(initialState))
})

export function createChainIdState(initialState) {
  return CHAIN_IDS.reduce(netIdWrapper(initialState), {})
}

export function isStorageAvailable(type) {
  try {
    const test = '__test__'
    const storage = window[type]

    storage.setItem(test, test)
    storage.removeItem(test)
    return true
  } catch {
    return false
  }
}
