<template>
  <div class="modal-card box box-modal">
    <header class="box-modal-header is-spaced">
      <div class="box-modal-title">{{ $t('withdrawalSettings') }}</div>
      <button type="button" class="delete" @click="$parent.cancel('escape')" />
    </header>
    <b-tabs v-model="withdrawType" :animated="false" class="is-modal">
      <RelayerTab />
      <WalletTab />
    </b-tabs>
  </div>
</template>
<script>
/* eslint-disable no-console */
import { mapState, mapMutations } from 'vuex'

import { RelayerTab, WalletTab } from '@/components/settings/tabs'

export default {
  components: {
    RelayerTab,
    WalletTab
  },
  props: {
    currency: {
      type: String,
      default: 'ETH'
    },
    title: {
      type: String,
      default: 'withdrawalSettings'
    }
  },
  provide() {
    return {
      currency: this.currency,
      save: this.save,
      reset: this.reset
    }
  },
  data() {
    return {
      withdrawType: 'relayer'
    }
  },
  computed: {
    ...mapState('application', {
      defaultWithdrawType: 'withdrawType'
    })
  },
  created() {
    this.withdrawType = this.defaultWithdrawType
  },
  methods: {
    ...mapMutations('application', ['SET_WITHDRAW_TYPE']),
    reset() {
      this.withdrawType = 'relayer'
      this.$root.$emit('resetSettings')
    },
    save() {
      this.SET_WITHDRAW_TYPE({ withdrawType: this.withdrawType })
      this.$emit('close')
    }
  }
}
</script>
