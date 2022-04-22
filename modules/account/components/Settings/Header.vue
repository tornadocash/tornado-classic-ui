<template>
  <div class="address">
    <div class="address-item">
      <div class="label">{{ $t('account.wallet.label') }}</div>
      <div class="value">{{ ethAccount || '-' }}</div>
    </div>
  </div>
</template>

<script>
import { walletComputed } from '../../injectors'

export default {
  computed: {
    ...walletComputed
  }
}
</script>
