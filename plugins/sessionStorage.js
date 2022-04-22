import { soliditySha3 } from 'web3-utils'

let isSessionStorageEnabled = null

try {
  window.sessionStorage.setItem('test', 'test')
  window.sessionStorage.removeItem('test')
  isSessionStorageEnabled = true
} catch (e) {
  isSessionStorageEnabled = false
}

const setItem = (key, value) => {
  if (isSessionStorageEnabled) {
    window.sessionStorage.setItem(
      soliditySha3(key),
      JSON.stringify({
        data: value,
        timeStamp: Date.now()
      })
    )
  }
}

const getItem = (key) => {
  if (isSessionStorageEnabled) {
    const value = window.sessionStorage.getItem(soliditySha3(key))

    try {
      return JSON.parse(String(value))
    } catch (err) {
      return value
    }
  }
  return undefined
}

const removeItem = (key) => {
  if (isSessionStorageEnabled) {
    return window.sessionStorage.removeItem(soliditySha3(key))
  }
}

const clear = () => {
  if (isSessionStorageEnabled) {
    window.sessionStorage.clear()
  }
}

const subscribe = (key, originalListener) => {
  const listener = (event) => {
    if (event.storageArea === window.sessionStorage && event.key === key) {
      originalListener(event.newValue, event.oldValue)
    }
  }
  window.addEventListener('storage', listener, false)
  return listener
}

const unsubscribe = (listener) => {
  window.removeEventListener('storage', listener, false)
}

export default (ctx, inject) => {
  const sessionStorage = {
    setItem,
    getItem,
    removeItem,
    clear,
    subscribe,
    unsubscribe
  }

  ctx.$sessionStorage = sessionStorage
  inject('sessionStorage', sessionStorage)
}
