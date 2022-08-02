import { addressType } from '@/constants'

const statusSchema = {
  type: 'object',
  properties: {
    rewardAccount: addressType,
    instances: {
      type: 'object',
      properties: {
        dai: {
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
            tokenAddress: addressType,
            symbol: { enum: ['DAI'] },
            decimals: { enum: [18] }
          },
          required: ['instanceAddress', 'tokenAddress', 'decimals']
        },
        usdt: {
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
              required: ['100', '1000']
            },
            tokenAddress: addressType,
            symbol: { enum: ['USDT'] },
            decimals: { enum: [6] }
          },
          required: ['instanceAddress', 'tokenAddress', 'decimals']
        },
        usdc: {
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
              required: ['100', '1000']
            },
            tokenAddress: addressType,
            symbol: { enum: ['USDC'] },
            decimals: { enum: [6] }
          },
          required: ['instanceAddress', 'tokenAddress', 'decimals']
        },
        cdai: {
          type: 'object',
          properties: {
            instanceAddress: {
              type: 'object',
              properties: {
                '5000': addressType,
                '50000': addressType,
                '500000': addressType,
                '5000000': addressType
              },
              required: ['5000', '50000', '500000', '5000000']
            },
            tokenAddress: addressType,
            symbol: { enum: ['cDAI'] },
            decimals: { enum: [8] }
          },
          required: ['instanceAddress', 'tokenAddress', 'decimals']
        },
        wbtc: {
          type: 'object',
          properties: {
            instanceAddress: {
              type: 'object',
              properties: {
                '0.1': addressType,
                '1': addressType,
                '10': addressType,
                '100': addressType
              },
              required: ['0.1', '1', '10']
            },
            tokenAddress: addressType,
            symbol: { enum: ['WBTC'] },
            decimals: { enum: [8] }
          },
          required: ['instanceAddress', 'tokenAddress', 'decimals']
        },
        eth: {
          type: 'object',
          properties: {
            instanceAddress: {
              type: 'object',
              properties: {
                '0.1': addressType,
                '1': addressType,
                '10': addressType,
                '100': addressType
              },
              required: ['0.1', '1', '10', '100']
            },
            decimals: { enum: [18] }
          },
          required: ['instanceAddress', 'decimals']
        }
      },
      required: ['eth']
    },
    gasPrices: {
      type: 'object',
      properties: {
        fast: { type: 'number' },
        additionalProperties: { type: 'number' }
      },
      required: ['fast']
    },
    netId: { type: 'integer' },
    ethPrices: {
      type: 'object',
      properties: {
        dai: { type: 'string', BN: true },
        cdai: { type: 'string', BN: true },
        usdc: { type: 'string', BN: true },
        usdt: { type: 'string', BN: true },
        torn: { type: 'string', BN: true },
        wbtc: { type: 'string', BN: true }
      },
      required: ['dai', 'cdai', 'usdc', 'usdt', 'torn', 'wbtc']
    },
    tornadoServiceFee: { type: 'number', maximum: 20, minimum: 0 },
    latestBlock: { type: 'number' },
    version: { type: 'string' },
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
  required: ['rewardAccount', 'instances', 'netId', 'ethPrices', 'tornadoServiceFee', 'version', 'health']
}

export { statusSchema }
