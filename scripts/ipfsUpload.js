// debug
// date +%s > dist/index.html & node ipfsUpload.js

require('dotenv').config()
const fs = require('fs')
const axios = require('axios')
const FormData = require('form-data')
const recursive = require('recursive-fs')
const basePathConverter = require('base-path-converter')

// it's dangerous to set MAX_PINS to 1
const MAX_PINS = 5

const baseUrl = `https://api.pinata.cloud`
const src = process.argv[2] || './dist'
const headers = {
  pinata_api_key: process.env.PINATA_API_KEY,
  pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY
}

async function removeOldPins() {
  const maxPins = MAX_PINS - 1

  const res = await axios.get(`${baseUrl}/data/pinList?pageOffset=${maxPins}&status=pinned`, {
    headers
  })

  const { count, rows } = res.data

  if (count && count > maxPins) {
    for (const { ipfs_pin_hash: ipfsPinHash } of rows) {
      await axios.delete(`${baseUrl}/pinning/unpin/${ipfsPinHash}`, {
        headers
      })
      console.log(`Successfully removed pin: ${ipfsPinHash}`)
    }
  }
}

async function pinBuild() {
  console.log('Make sure you have latest build. Run `npm run generate` if necessary.')
  const { files } = await recursive.readdirr(src)
  const data = new FormData()
  files.forEach((file) => {
    // for each file stream, we need to include the correct relative file path
    data.append(`file`, fs.createReadStream(file), {
      filepath: basePathConverter(src, file)
    })
  })

  const res = await axios.post(`${baseUrl}/pinning/pinFileToIPFS`, data, {
    maxContentLength: 'Infinity', // this is needed to prevent axios from erroring out with large directories
    headers: {
      'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
      ...headers
    }
  })

  const ipfsHash = res.data.IpfsHash

  console.log(`Your site is ready! IPFS hash: ${ipfsHash}`)
  console.log(`output for github-actions:`)
  console.log(`::set-output name=ipfs_hash::${ipfsHash}`)
  console.log(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`)
}

async function main() {
  await removeOldPins()
  await pinBuild()
}

main().catch((e) => {
  console.log(e)
  process.exit(1)
})
