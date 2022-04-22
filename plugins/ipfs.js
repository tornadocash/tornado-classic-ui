/* eslint-disable camelcase, no-undef */
export default (context, inject) => {
  const ipfsPathRegExp = /^(\/(?:ipfs|ipns)\/[^/]+)/
  const ipfsPathPrefix = (window.location.pathname.match(ipfsPathRegExp) || [])[1] || ''

  console.log('plugin __webpack_public_path__', __webpack_public_path__)

  if (ipfsPathPrefix) {
    __webpack_public_path__ = ipfsPathPrefix + '/_nuxt/'

    if (typeof window !== 'undefined') {
      context.app.router.history.base = ipfsPathPrefix || window.location.host
    }
  }

  console.log('plugin __webpack_public_path__', __webpack_public_path__)
}
