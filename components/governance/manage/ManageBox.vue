<template>
  <div class="modal-card box box-modal has-delete">
    <button type="button" class="delete" @click="$emit('close')" />
    <b-tabs v-model="activeTab" :data-test="`tab_${activeTab}`" :animated="false" class="is-modal">
      <LockTab />
      <UnlockTab />
      <DelegateTab />
      <UndelegateTab />
      <RewardTab />
    </b-tabs>
  </div>
</template>
<script>
/* eslint-disable no-console */
import { mapActions } from 'vuex'
import { BigNumber as BN } from 'bignumber.js'

import { LockTab, UnlockTab, DelegateTab, UndelegateTab, RewardTab } from './tabs'

export default {
  components: {
    LockTab,
    UnlockTab,
    DelegateTab,
    UndelegateTab,
    RewardTab
  },
  provide() {
    return {
      close: this.$parent.close,
      formatNumber: this.formatNumber
    }
  },
  data() {
    return {
      activeTab: 0
    }
  },
  mounted() {
    this.fetchTokenAllowance()
  },
  methods: {
    ...mapActions('torn', ['fetchTokenAllowance']),
    formatNumber(value) {
      value = String(value).replace(',', '.')

      let [amount, decimals] = value.split('.')

      if (decimals && decimals.length > 18) {
        decimals = decimals.slice(0, 17)
        amount = new BN(`${amount}.${decimals}`)
      } else {
        amount = new BN(value)
      }

      return isNaN(amount) ? '0' : amount.toString(10)
    }
  }
}
</script>
