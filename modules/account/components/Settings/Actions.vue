<template>
  <div class="action">
    <div class="action-item">
      <b-icon icon="account-wallet" size="is-large" />
      <div class="desc">
        {{ isLoggedIn ? $t('account.wallet.disconnect') : $t('account.wallet.desc') }}
      </div>
      <b-button
        v-if="isLoggedIn"
        type="is-primary"
        outlined
        data-test="button_disconnect_account"
        @mousedown.prevent
        @click="onLogOut"
      >
        {{ $t('account.wallet.logout') }}
      </b-button>
      <connect-button
        v-else
        outlined
        action-text="account.wallet.connectWeb3"
        data-test="button_connect_web3"
      />
    </div>
    <div class="action-item">
      <b-icon icon="account-rpc" size="is-large" />
      <div class="desc">
        {{ $t('account.wallet.rpcDesc') }}
      </div>
      <b-button type="is-primary" data-test="button_change_rpc" outlined @click="onSettings">{{
        $t('account.wallet.changeRpc')
      }}</b-button>
    </div>
  </div>
</template>

<script>
import { walletComputed, walletActions } from '../../injectors'
import { openSettingsModal } from '../../modals'

import { ConnectButton } from '@/components/web3Connect'

export default {
  components: {
    ConnectButton
  },
  computed: {
    ...walletComputed
  },
  methods: {
    ...walletActions,
    onSettings() {
      openSettingsModal({
        parent: this,
        netId: this.netId
      })
    }
  }
}
</script>
