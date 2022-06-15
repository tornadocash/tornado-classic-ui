<template>
  <div class="action">
    <div class="action-item">
      <b-icon icon="account-setup" size="is-large" />
      <div class="desc">
        {{ $t('account.setup.desc') }}
      </div>
      <b-tooltip :active="isAccountDisabled" :label="$t(setupAccountTooltip)" multilined size="is-large">
        <b-button
          :disabled="isAccountDisabled"
          outlined
          type="is-primary"
          data-test="button_setup_account"
          @click="showSetupModal"
        >
          {{ $t('account.setup.account') }}
        </b-button>
      </b-tooltip>
    </div>
    <div class="action-item">
      <b-icon icon="account-recover" size="is-large" />
      <div class="desc">
        {{ $t('account.setup.recoverDesc') }}
      </div>
      <b-tooltip :active="isRecoverDisabled" :label="$t(recoverAccountTooltip)" multilined size="is-large">
        <b-button
          type="is-primary"
          outlined
          :disabled="isRecoverDisabled"
          data-test="button_recover_account"
          @click="handleRecoverAccount"
        >
          {{ $t('account.setup.recover') }}
        </b-button>
      </b-tooltip>
    </div>
    <div class="action-item">
      <b-icon icon="account-raw" size="is-large" />
      <div class="desc">
        {{ $t('account.setup.enterRawDesc') }}
      </div>
      <b-button
        type="is-primary"
        outlined
        data-test="button_enter_account_key"
        @click="showRecoverKeyModal"
        >{{ $t('account.setup.enterRaw') }}</b-button
      >
    </div>
  </div>
</template>

<script>
import { setupComputed, setupMethods } from '../../injectors'
import { openDecryptModal, openRecoverAccountModal, openSetupAccountModal } from '../../modals'

export default {
  computed: {
    ...setupComputed,
    isAccountDisabled() {
      return this.isExistAccount || !this.isLoggedIn
    },
    isRecoverDisabled() {
      return !this.isExistAccount || !this.isLoggedIn || this.isPartialSupport
    },
    recoverAccountTooltip() {
      if (this.isPartialSupport) {
        return 'mobileWallet.actions.disabled'
      }
      return this.isLoggedIn ? 'account.setup.recTooltip' : 'connectYourWalletFirst'
    },
    setupAccountTooltip() {
      return this.isLoggedIn ? 'account.setup.setTooltip' : 'connectYourWalletFirst'
    }
  },
  methods: {
    ...setupMethods,
    async getEncryptedNotes() {
      const props = await this.decryptNotes()

      if (props) {
        openDecryptModal({ ...props, parent: this })
      }
    },
    showRecoverKeyModal() {
      openRecoverAccountModal({ parent: this, getNotes: this.getEncryptedNotes })
    },
    showSetupModal() {
      openSetupAccountModal({ parent: this })
    },
    async handleRecoverAccount() {
      try {
        this.enable({ message: this.$t('account.setup.decrypt') })
        await this.recoverAccountFromChain()
        await this.getEncryptedNotes()
      } catch {
        this.addNoticeWithInterval({
          notice: {
            title: 'decryptFailed',
            type: 'danger'
          },
          interval: 5000
        })
      } finally {
        this.disable()
      }
    }
  }
}
</script>
