<template>
  <div v-if="isReconnectButtonShow" class="loading-alert">
    {{ $t('mobileWallet.loading.alert') }}
    <b-button type="is-primary" size="small" class="max-content is-outlined" @click="onReconnect">
      {{ $t('mobileWallet.loading.action') }}
    </b-button>
  </div>
</template>
<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { SECOND } from '@/constants'

export default {
  data() {
    return {
      isReconnectButtonShow: false
    }
  },
  computed: {
    ...mapGetters('metamask', ['isWalletConnect', 'netId']),
    ...mapState('loading', ['enabled'])
  },
  mounted() {
    this.onClearData()

    if (this.isWalletConnect) {
      this.timeout = setTimeout(() => {
        this.isReconnectButtonShow = true
      }, SECOND * 20)
    }
  },
  destroyed() {
    this.onClearData()
  },
  methods: {
    ...mapActions('metamask', ['mobileWalletReconnect']),
    async onReconnect() {
      await this.mobileWalletReconnect(this.netId)
    },
    onClearData() {
      if (this.timeout) {
        this.isReconnectButtonShow = false
        clearTimeout(this.timeout)
      }
    }
  }
}
</script>
