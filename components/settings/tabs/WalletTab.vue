<template>
  <b-tab-item :label="$t('wallet')" value="wallet" header-class="withdrawal_settings_wallet_tab">
    <fieldset :disabled="isNotLoggedIn">
      <div class="notice is-warning">
        <div class="notice__p">{{ $t('withdrawWalletWarning', { currency: networkCurrency }) }}</div>
        <div v-if="isNotLoggedIn" class="tooltip" :data-label="$t('connectYourWalletFirst')"></div>
      </div>
      <WithdrawTotal :currency="currency" withdraw-type="wallet" />
    </fieldset>
    <div class="buttons buttons__halfwidth mt-5">
      <b-button type="is-primary" outlined @mousedown.prevent @click="onReset">
        {{ $t('reset') }}
      </b-button>
      <connect-button v-if="isNotLoggedIn" />
      <b-button v-else type="is-primary" @click="onSave">
        {{ $t('save') }}
      </b-button>
    </div>
  </b-tab-item>
</template>

<script>
import { mapGetters } from 'vuex'

import { ConnectButton } from '@/components/web3Connect'
import WithdrawTotal from '@/components/withdraw/WithdrawTotal'

export default {
  components: {
    ConnectButton,
    WithdrawTotal
  },
  inject: ['save', 'reset', 'currency'],
  computed: {
    ...mapGetters('metamask', ['isLoggedIn']),
    ...mapGetters('metamask', {
      networkCurrency: 'currency'
    }),
    isNotLoggedIn() {
      return !this.isLoggedIn
    }
  },
  methods: {
    onReset() {
      this.reset()
    },
    onSave() {
      this.save()
    }
  }
}
</script>
