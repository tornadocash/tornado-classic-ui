import BN from 'bignumber.js'
import WalletConnectProvider from '@walletconnect/web3-provider'

import { NETWORKS } from '@/constants'
import networkConfig from '@/networkConfig'

const { WC_BRIDGE } = process.env

const WALLET_CONNECT_INTERVAL = 1000
const SUPPORTED_WALLETS = ['metamask', 'trust', 'imtoken', 'genericWeb3']

const RECONNECT_TIME = 3600000 // 1 hour

const getFirstRpcUrls = (acc, netId) => {
  const { rpcUrls } = networkConfig[`netId${netId}`]
  const [{ url }] = Object.values(rpcUrls)

  return { ...acc, [netId]: url }
}

const RPC = NETWORKS.reduce(getFirstRpcUrls, {})

const walletConnectConnector = (chainId) => {
  try {
    const prevConnection = localStorage.getItem('walletconnectTimeStamp')

    if (new BN(Date.now()).minus(prevConnection).isGreaterThanOrEqualTo(RECONNECT_TIME)) {
      localStorage.removeItem('walletconnect')
    }

    const provider = new WalletConnectProvider({
      chainId,
      rpc: RPC,
      pollingInterval: WALLET_CONNECT_INTERVAL,
      qrcodeModalOptions: {
        mobileLinks: SUPPORTED_WALLETS
      },
      bridge: WC_BRIDGE
    })

    provider.injectedRequest = provider.enable

    localStorage.setItem('walletconnectTimeStamp', Date.now())
    return provider
  } catch (err) {
    console.log(err)
    throw new Error('WalletConnect error: ', err)
  }
}

export default walletConnectConnector
