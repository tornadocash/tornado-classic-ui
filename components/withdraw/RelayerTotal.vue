<template>
  <div class="field">
    <div class="label">
      {{ $t('relayerTotal.label') }}
    </div>
    <div class="withdraw-data">
      <div class="withdraw-data-item">
        {{ $t('relayerTotal.name') }}
        <span>{{ relayerName }}</span>
      </div>
      <div class="withdraw-data-item">
        {{ $t('relayerTotal.fee') }}
        <span>{{ selectedRelayer.tornadoServiceFee }}%</span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState('relayer', ['selectedRelayer']),
    relayerName() {
      const { name, url } = this.selectedRelayer

      if (name === 'custom') {
        return url.replace(/http(s)?|:|\//g, '')
      }

      return name
    }
  }
}
</script>
