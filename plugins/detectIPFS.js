/* eslint-disable no-console */
export default ({ store, isHMR, app }, inject) => {
  inject('isLoadedFromIPFS', main)
}
function main() {
  const domainWhiteList = [
    'tornado.cash',
    'localhost:3000',
    'stage.tornado.cash',
    'tornadocash.eth',
    'tornadocash.eth.link',
    'tornadocash.eth.limo',
    'app.tornado.cash',
    'donotshare.tornado.cash'
  ]

  if (window.location.host.includes('tornadocash.netlify.app')) {
    return false
  } else if (!domainWhiteList.includes(window.location.host)) {
    console.warn('The page has been loaded from ipfs.io. LocalStorage is disabled')
    return true
  }

  return false
}
