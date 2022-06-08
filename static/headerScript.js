const main = () => {
  if (window.location.search) {
    console.log('redirect')
    window.location = window.location.origin + window.location.pathname
  }

  function addScript(src) {
    const s = document.createElement('script')
    s.setAttribute('src', src)
    document.body.appendChild(s)
  }

  document.addEventListener('DOMContentLoaded', () => {
    const ipfsPathRegExp = /^(\/(?:ipfs|ipns)\/[^/]+)/
    const ipfsPathPrefix = (window.location.pathname.match(ipfsPathRegExp) || [])[1] || ''
    if (ipfsPathPrefix) {
      const scripts = [...document.getElementsByTagName('script')]

      for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src) {
          const source = new URL(scripts[i].src)
          if (!source.pathname.includes(ipfsPathPrefix)) {
            console.log('Loading', source.pathname)

            const newSource = window.location.origin + ipfsPathPrefix + source.pathname
            addScript(newSource)
          }
        }
      }
      console.log('Finished')
    }
  })
}

main()
