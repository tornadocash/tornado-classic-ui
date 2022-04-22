import { BigNumber as BN } from 'bignumber.js'

// return the number of decimal places of the value
export function decimalPlaces(value) {
  return new BN(value).dp()
}
