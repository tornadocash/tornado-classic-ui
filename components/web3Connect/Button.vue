<template>
  <b-button :type="type" v-bind="$attrs" @click="onLogIn">{{ $t(actionText) }}</b-button>
</template>

<script>
import { mapActions } from 'vuex'

import Web3Connect from './Modal'

import { detectMob } from '@/utils'

export default {
  inheritAttrs: false,
  props: {
    type: {
      type: String,
      default: 'is-primary'
    },
    actionText: {
      type: String,
      default: () => 'connect'
    }
  },
  computed: {
    hasInjectedProvider() {
      return Boolean(window.ethereum)
    }
  },
  methods: {
    ...mapActions('metamask', ['initialize']),
    async web3Connect(name) {
      this.$store.dispatch('loading/enable', {})
      try {
        await this.initialize({
          providerName: name
        })
      } catch (e) {
        console.error(e)
      }
      this.$store.dispatch('loading/disable')
    },
    onLogIn() {
      if (detectMob() && this.hasInjectedProvider) {
        this.web3Connect('mobileWallet')
        return
      }

      this.$buefy.modal.open({
        parent: this,
        component: Web3Connect,
        hasModalCard: true,
        width: 440,
        props: {
          web3Connect: this.web3Connect
        }
      })
    }
  }
}
</script>
