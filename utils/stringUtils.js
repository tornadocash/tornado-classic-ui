export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export const hashRender = (hash, size = 4, separator = '...') => {
  return hash.slice(0, size) + separator + hash.slice(-size)
}

export const sliceAddress = (address) => {
  return '0x' + hashRender(address.slice(2))
}

const semVerRegex = /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

export const parseSemanticVersion = (version) => {
  const { groups } = semVerRegex.exec(version)
  return groups
}

export const isWalletRejection = (err) => {
  return /cance(l)+ed|denied|rejected/im.test(err.message)
}
