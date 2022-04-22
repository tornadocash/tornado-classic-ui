<template>
  <div class="modal-card box box-modal">
    <header class="box-modal-header is-spaced">
      <div class="box-modal-title">{{ $t('insufficientBalance') }}</div>
      <button type="button" class="delete" @click="$emit('close')" />
    </header>
    <i18n path="youDontHaveEnoughTokens" tag="div" class="note">
      <template v-slot:currency>{{ selectedCurrency }}</template>
      <template v-slot:balance><number-format :value="currentBalance"/></template>
    </i18n>
    <b-button type="is-primary is-fullwidth" @click="close">{{ $t('close') }}</b-button>
  </div>
</template>
<script>
/* eslint-disable no-console */
import { mapState, mapGetters } from 'vuex'
import NumberFormat from '@/components/NumberFormat'

export default {
  components: {
    NumberFormat
  },
  computed: {
    ...mapState('application', ['selectedInstance']),
    ...mapState('token', ['balance']),
    ...mapGetters('token', ['toDecimals']),
    ...mapState('metamask', ['ethBalance']),
    ...mapGetters('metamask', ['nativeCurrency']),
    ...mapGetters('application', ['selectedCurrency']),
    currentBalance() {
      const balance = this.selectedInstance.currency === this.nativeCurrency ? this.ethBalance : this.balance
      return this.toDecimals(balance, null, 6)
    }
  },
  methods: {
    close() {
      this.$parent.close()
    }
  }
}
</script>
