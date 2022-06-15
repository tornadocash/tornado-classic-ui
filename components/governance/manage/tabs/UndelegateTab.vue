<template>
  <b-tab-item :label="$t('undelegate')">
    <div class="p">
      {{ $t('undelegateTabDesc') }}
    </div>
    <div class="label-with-value">
      {{ $t('currentDelegate') }}:
      <a target="_blank" :href="addressExplorerUrl(currentDelegate)" rel="noopener noreferrer">{{
        delegateMsg
      }}</a>
    </div>
    <b-tooltip
      class="is-block"
      :label="`${$t('pleaseDelegate')}`"
      position="is-top"
      :active="!canUndelegate"
      multilined
    >
      <b-button :disabled="!canUndelegate" type="is-primary is-fullwidth" outlined @click="onUndelegate">
        {{ $t('undelegate') }}
      </b-button>
    </b-tooltip>
  </b-tab-item>
</template>

<script>
import { mapActions, mapState, mapGetters } from 'vuex'

export default {
  inject: ['close'],
  computed: {
    ...mapState('governance/gov', ['currentDelegate']),
    ...mapGetters('txHashKeeper', ['addressExplorerUrl']),
    canUndelegate() {
      return this.currentDelegate !== '0x0000000000000000000000000000000000000000'
    },
    delegateMsg() {
      if (!this.canUndelegate) {
        return this.$t('none')
      } else {
        return this.currentDelegate
      }
    }
  },
  methods: {
    ...mapActions('governance/gov', ['undelegate']),
    async onUndelegate() {
      this.$store.dispatch('loading/enable', { message: this.$t('preparingTransactionData') })
      await this.undelegate()
      this.$store.dispatch('loading/disable')
      this.close()
    }
  }
}
</script>
