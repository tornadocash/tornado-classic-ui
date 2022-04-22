<template>
  <div class="wallet-account">
    <h2 class="title">
      {{ $t('wallet') }}
    </h2>
    <div class="account-box">
      <Header />
      <Actions />
    </div>
  </div>
</template>

<script>
import Header from './Header'
import Actions from './Actions'

export default {
  components: {
    Header,
    Actions
  }
}
</script>
