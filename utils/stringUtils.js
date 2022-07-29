export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export const hashRender = (hash, size = 4, separator = '...') => {
  return hash.slice(0, size) + separator + hash.slice(-size)
}

export const sliceAddress = (address) => {
  return '0x' + hashRender(address.slice(2))
}

export const sliceEnsName = (name, size = 4, separator = '...') => {
  const chars = [...name]

  const last = name
    .split('.')
    .pop()
    .slice(-size)

  if (chars[0]?.length === 2 && last) {
    // 🐵🍆💦.eth -> 🐵🍆💦.eth
    if (chars.length - 4 <= 4) return name

    // 🦍🦍🦍🦍🦍🦍🦍.eth -> 🦍🦍🦍...eth
    return [].concat(chars.slice(0, 3), separator, last).join('')
  }

  if (chars.length <= 2 * size + 2 + separator.length) return name
  if (!name.includes('.')) return sliceAddress(name, size, separator)

  return last.length
    ? [].concat(chars.slice(0, 2 * size - last.length), separator, last).join('')
    : [].concat(chars.slice(0, size), separator, chars.slice(-size)).join('')
}

const semVerRegex = /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

export const parseSemanticVersion = (version) => {
  const { groups } = semVerRegex.exec(version)
  return groups
}

export const isWalletRejection = (err) => {
  return /cance(l)+ed|denied|rejected/im.test(err.message)
}
