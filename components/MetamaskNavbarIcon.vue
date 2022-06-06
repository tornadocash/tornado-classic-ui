<template>
  <b-tooltip position="is-bottom" type="is-dark-tooltip" :triggers="[]">
    <template v-slot:content>
      <template v-if="isLoggedIn">
        <p>{{ $t('web3connected') }}</p>
        <a :href="addressExplorerUrl(ethAccount)" target="_blank" rel="noopener noreferrer">{{
          shortAddress(ethAccount)
        }}</a>
        <p><NumberFormat :value="balance" /> {{ currency }}</p>
      </template>
      <template v-else>
        <p>{{ $t('notConnected') }}</p>
        <connect-button type="is-primary-link mb-0" />
      </template>
    </template>
    <b-button type="is-nav-icon" :icon-left="wallet" :class="{ [wallet]: isLoggedIn }"></b-button>
  </b-tooltip>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import { sliceAddress } from '@/utils'
import NumberFormat from '@/components/NumberFormat'
import { ConnectButton } from '@/components/web3Connect'

export default {
  components: {
    NumberFormat,
    ConnectButton
  },
  props: {
    active: {
      type: Boolean
    }
  },
  data() {
    return {
      isActive: false,
      timer: null
    }
  },
  computed: {
    ...mapState('metamask', ['ethAccount', 'ethBalance', 'providerName']),
    ...mapGetters('metamask', ['isLoggedIn', 'currency']),
    ...mapGetters('token', ['toDecimals']),
    ...mapGetters('txHashKeeper', ['addressExplorerUrl']),
    balance() {
      return this.toDecimals(this.ethBalance)
    },
    wallet() {
      const supportedWallets = ['metamask', 'walletConnect']

      if (supportedWallets.includes(this.providerName)) {
        return this.providerName
      }
      return 'metamask'
    }
  },
  methods: {
    shortAddress(address) {
      return sliceAddress(address)
    }
  }
}
</script>
