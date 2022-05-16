<template>
  <div class="modal-card box box-modal is-wallet-modal">
    <header class="box-modal-header is-spaced">
      <div class="box-modal-title">{{ $t('yourWallet') }}</div>
      <button type="button" class="delete" data-test="close_popup_button" @click="$emit('close')" />
    </header>
    <div class="note">
      {{ $t('pleaseSelectYourWeb3Wallet') }}
    </div>
    <div class="field is-grouped is-grouped-centered is-grouped-multiline wallets">
      <div class="control">
        <button
          v-show="isGeneric"
          class="button is-small is-background is-generic"
          @click="_web3Connect('generic')"
        >
          {{ $t('otherWallet') }}
        </button>
        <button v-show="!isMetamask" class="button is-small is-dark is-metamask" @click="onBoarding">
          Install Metamask
        </button>
        <button
          v-show="isMetamask"
          class="button is-small is-background is-metamask"
          data-test="choose_metamask_option"
          @click="_web3Connect('metamask')"
        >
          Metamask
        </button>
        <button
          class="button is-small is-background is-walletConnect"
          data-test="choose_wallet_option"
          @click="_web3Connect('walletConnect')"
        >
          WalletConnect
        </button>
      </div>
    </div>
  </div>
</template>
<script>
import Metamask from '@metamask/onboarding'

export default {
  props: {
    web3Connect: {
      type: Function,
      required: true
    }
  },
  computed: {
    isMetamask() {
      return window.ethereum?.isMetaMask
    },
    isGeneric() {
      return !this.isMetamask && window.ethereum
    }
  },
  mounted() {
    if (!this.isMetamask) {
      this.onboarding = new Metamask()
    }
  },
  methods: {
    onBoarding() {
      this.onboarding.startOnboarding()
    },
    async _web3Connect(name) {
      await this.web3Connect(name)

      this.$parent.close()
    }
  }
}
</script>
