import FileSaver from 'file-saver'

export * from './crypto'
export * from './debounce'
export * from './adapters'
export * from './storeUtils'
export * from './stringUtils'
export * from './numberUtils'
export * from './instanceUtils'

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function detectMob() {
  if (
    navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/webOS/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPod/i) ||
    navigator.userAgent.match(/BlackBerry/i) ||
    navigator.userAgent.match(/Windows Phone/i)
  ) {
    return true
  } else {
    return false
  }
}

export function saveAsFile(data, name) {
  if (detectMob()) {
    return
  }

  FileSaver.saveAs(data, name)
}
