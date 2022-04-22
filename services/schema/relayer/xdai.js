import { addressType } from '@/constants'

const statusSchema = {
  type: 'object',
  properties: {
    rewardAccount: addressType,
    instances: {
      type: 'object',
      properties: {
        xdai: {
          type: 'object',
          properties: {
            instanceAddress: {
              type: 'object',
              properties: {
                '100': addressType,
                '1000': addressType,
                '10000': addressType,
                '100000': addressType
              },
              required: ['100', '1000', '10000', '100000']
            },
            decimals: { enum: [18] }
          },
          required: ['instanceAddress', 'decimals']
        }
      },
      required: ['xdai']
    },
    netId: { type: 'integer' },
    tornadoServiceFee: { type: 'number', maximum: 20, minimum: 0 },
    health: {
      type: 'object',
      properties: {
        status: { const: 'true' },
        error: { type: 'string' }
      },
      required: ['status']
    },
    currentQueue: { type: 'number' }
  },
  required: ['rewardAccount', 'instances', 'netId', 'tornadoServiceFee', 'health']
}

export { statusSchema }
