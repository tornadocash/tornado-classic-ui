<template>
  <div class="address">
    <div class="address-item">
      <div class="label">{{ $t('account.account') }}</div>
      <div class="value" data-test="note_account_address">{{ accounts.backup }}</div>
    </div>
    <div class="address-item">
      <div class="label">{{ $t('account.backedUpWith') }}</div>
      <div class="value">{{ accounts.encrypt }}</div>
    </div>
  </div>
</template>

<script>
import { headerComputed } from '../../injectors'

export default {
  computed: {
    ...headerComputed
  },
  watch: {},
  methods: {}
}
</script>
