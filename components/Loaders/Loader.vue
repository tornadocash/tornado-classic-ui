<template>
  <b-loading v-model="enabled">
    <div class="loading-container">
      <div class="loading-tornado" data-test="tornado_loader"></div>
      <div class="loading-message">{{ message }}...</div>
      <approve-loader v-if="isApprove" />
    </div>
  </b-loading>
</template>
<script>
import { mapState, mapGetters } from 'vuex'

import ApproveLoader from './ApproveLoader'

export default {
  components: {
    ApproveLoader
  },
  computed: {
    ...mapGetters('metamask', ['isWalletConnect']),
    ...mapState('metamask', ['providerName']),
    ...mapState('loading', ['enabled', 'message', 'type']),
    isApprove() {
      return this.type === 'approve'
    }
  }
}
</script>
