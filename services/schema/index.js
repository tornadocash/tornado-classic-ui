import { toBN } from 'web3-utils'

import relayerSchemas from './relayer'

const Ajv = require('ajv')
const ajv = new Ajv({ allErrors: true, schemas: relayerSchemas })

ajv.addKeyword('BN', {
  validate: (schema, data) => {
    try {
      toBN(data)
      return true
    } catch (e) {
      return false
    }
  },
  errors: true
})

function getRelayerValidateFunction(netId) {
  switch (netId) {
    case 56:
      return ajv.getSchema('bscRelayer')
    case 100:
      return ajv.getSchema('xdaiRelayer')
    case 137:
      return ajv.getSchema('polygonRelayer')
    case 43114:
      return ajv.getSchema('avalancheRelayer')

    case 10:
    case 42161:
      return ajv.getSchema('l2Relayer')

    default:
      return ajv.getSchema('defaultRelayer')
  }
}

export default {
  getRelayerValidateFunction
}
