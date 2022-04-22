<template>
  <b-select
    v-model="selectedNetwork"
    class="network-select"
    placeholder="Select a network"
    size="is-small"
    expanded
    @input="updateNetwork()"
  >
    <option v-for="network in networks" :key="network.networkName" :value="network.networkName.toLowerCase()">
      {{ network.networkName }}
    </option>
  </b-select>
</template>

<script>
import networkConfig from '@/networkConfig'

export default {
  props: {
    value: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      selectedNetwork: this.value,
      networkConfig
    }
  },
  computed: {
    networks() {
      const networkConfig = Object.assign({}, this.networkConfig)
      delete networkConfig.netId333
      return networkConfig
    }
  },
  methods: {
    updateNetwork() {
      this.$emit('input', this.selectedNetwork)
    }
  }
}
</script>
