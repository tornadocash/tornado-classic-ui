import { execSync } from 'child_process'
import webpack from 'webpack'

const hooks = (nuxtConfig) => ({
  'generate:page': (page) => {
    page.html = modifyHtml(page.html)
  },
  'render:route': (url, page, { req, res }) => {
    page.html = modifyHtml(page.html)
  }
})

let hasSourceMaps = '#source-map'
if (process.env.NODE_ENV !== 'development') {
  // eslint-disable-next-line no-console
  console.log('NODE_ENV', process.env.NODE_ENV)
  hasSourceMaps = false
}

function getCurrentCommit() {
  try {
    return execSync('git rev-parse HEAD')
      .toString()
      .trim()
      .substr(0, 7)
  } catch (e) {
    console.error('Failed to get git commit', e.message)
    return 'debug'
  }
}

const modifyHtml = (html) => {
  return html.replace(/data-n-head=""|data-n-head="true"/g, '')
}

export default {
  target: 'static',
  ssr: false,
  /*
   ** Headers of the page
   */
  generate: {
    concurrency: 1,
    fallback: true
  },
  head: {
    title: 'Tornado.cash',
    meta: [
      { charset: 'utf-8' },
      {
        'http-equiv': 'Content-Security-Policy',
        content:
          "img-src 'self' data:;font-src data:;style-src 'self' 'unsafe-inline';connect-src *;script-src 'self' 'unsafe-eval' 'unsafe-inline';default-src 'self';object-src 'none';base-uri 'none';upgrade-insecure-requests;child-src blob:;worker-src blob:;"
      },
      {
        name: 'Referer-Policy',
        content: 'no-referrer'
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      },
      { name: 'theme-color', content: '#000403' },
      {
        hid: 'description',
        name: 'description',
        content: 'Non-custodial Ethereum Privacy solution.'
      },
      {
        hid: 'og:title',
        property: 'og:title',
        content: 'Tornado.Cash'
      },
      {
        hid: 'og:description',
        property: 'og:description',
        content: 'Non-custodial, trustless, serverless, private transactions on Ethereum network'
      },
      {
        hid: 'og:url',
        property: 'og:url',
        content: 'https://tornado.cash'
      },
      {
        hid: 'og:type',
        property: 'og:type',
        content: 'website'
      },
      {
        hid: 'og:image',
        property: 'og:image',
        content: 'https://tornado.cash/tw.png'
      },
      {
        hid: 'description',
        name: 'description',
        content: 'Non-custodial, trustless, serverless, private transactions on Ethereum network'
      },
      {
        hid: 'keywords',
        name: 'keywords',
        content:
          'Tornado, Ethereum, ERC20, dapp, smart contract, decentralized, metamask, zksnark, zero knowledge'
      }
    ],
    link: [
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'shortcut icon', type: 'image/x-icon', href: '/favicon/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/favicon/apple-touch-icon.png' }
    ]
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: '#94febf', height: '5px', duration: 5000 },
  /*
   ** Global CSS
   */
  css: ['@/assets/styles/app.scss'],

  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    '~/plugins/ipfs.js',
    { src: '~plugins/clipboard', ssr: false },
    { src: '~plugins/detectIPFS', ssr: false },
    { src: '~plugins/localStorage', ssr: false },
    { src: '~plugins/preventMultitabs', ssr: false },
    { src: '~plugins/idb', ssr: false },
    { src: '~plugins/vidle', ssr: false },
    { src: '~plugins/sessionStorage', ssr: false },
    '~plugins/numbro/numbro',
    '~/plugins/i18n.js'
  ],
  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://buefy.github.io/#/documentation
    [
      'nuxt-buefy',
      {
        css: false,
        materialDesignIcons: false,
        defaultIconPack: 'trnd',
        defaultModalCanCancel: ['escape', 'button', 'outside'],
        defaultProgrammaticPromise: true,
        customIconPacks: {
          trnd: {
            sizes: {
              default: 'trnd-24px',
              'is-small': null,
              'is-medium': 'trnd-36px',
              'is-large': 'trnd-48px'
            },
            iconPrefix: 'trnd-'
          }
        }
      }
    ],
    '@nuxtjs/eslint-module',
    'nuxt-web3-provider'
  ],
  router: {
    linkActiveClass: '',
    linkExactActiveClass: 'is-active'
  },
  hooks: hooks(this),
  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {
      if (ctx.isClient) {
        config.devtool = hasSourceMaps
      }
      config.module.rules.push({
        test: /\.bin$/,
        use: 'arraybuffer-loader'
      })
    },
    plugins: [
      new webpack.IgnorePlugin(/worker_threads/),
      new webpack.DefinePlugin({
        'process.env': JSON.stringify({
          INFURA_KEY: process.env.INFURA_KEY,
          ALCHEMY_MAINNET_KEY: process.env.ALCHEMY_MAINNET_KEY,
          ALCHEMY_POLYGON_KEY: process.env.ALCHEMY_POLYGON_KEY,
          ALCHEMY_OPTIMISM_KEY: process.env.ALCHEMY_OPTIMISM_KEY,
          ALCHEMY_ARBITRUM_KEY: process.env.ALCHEMY_ARBITRUM_KEY,
          ALCHEMY_GOERLI_KEY: process.env.ALCHEMY_GOERLI_KEY,
          WC_BRIDGE: process.env.WC_BRIDGE,
          OLD_STORE_NAME: process.env.OLD_STORE_NAME,
          STORE_NAME: process.env.STORE_NAME,
          APP_ENS_NAME: process.env.APP_ENS_NAME
        })
      })
    ],
    html: {
      minify: {
        collapseWhitespace: true, // as @dario30186 mentioned
        removeComments: true // 👈 add this line
      }
    },
    loaders: {
      fontUrl: { limit: 25000 },
      imgUrl: { limit: 15000 }
    },
    splitChunks: {
      layouts: false,
      pages: false,
      commons: false
    }
  },
  buildModules: [
    [
      '@nuxtjs/moment',
      {
        defaultLocale: 'en',
        locales: ['ru', 'zh-cn', 'fr', 'es', 'tr', 'uk']
      }
    ]
  ],
  env: {
    commit: getCurrentCommit()
  },

  provider: {
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`
  },

  // todo make custom loading page
  loadingIndicator: {
    name: 'circle',
    color: '#94febf',
    background: '#000'
  }
}
