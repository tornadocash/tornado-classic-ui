/* eslint-disable no-console */
export default ({ store, isHMR, app }, inject) => {
  inject('isLoadedFromIPFS', main)
}
function main() {
  const whiteListedDomains = ['localhost:3000', 'tornadocash.eth.link', 'tornadocash.eth.limo']

  const NETLIFY_REGEXP = /deploy-preview-(\d+)--tornadocash\.netlify\.app/

  if (NETLIFY_REGEXP.test(window.location.host)) {
    return false
  } else if (!whiteListedDomains.includes(window.location.host)) {
    console.warn('The page has been loaded from ipfs.io. LocalStorage is disabled')
    return true
  }

  return false
}
