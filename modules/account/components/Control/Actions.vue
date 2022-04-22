<template>
  <div class="action">
    <Statistic />
    <div v-for="action in actions" :key="action.description" class="action-item">
      <b-icon :icon="action.icon" size="is-large" />
      <div class="desc">
        {{ $t(action.description) }}
      </div>
      <b-button type="is-primary" outlined @mousedown.prevent @click="action.onClick">
        {{ $t(action.button) }}
      </b-button>
    </div>
    <div class="action-item has-switch">
      <b-icon icon="account-file" size="is-large" />
      <div class="desc">
        {{ $t('account.control.fileDesc') }}
      </div>
      <b-switch :value="isEnabledSaveFile" size="is-medium" @input="handleEnabledSaveFile" />
    </div>
  </div>
</template>

<script>
import { openDecryptModal, openShowRecoverKeyModal, openRemoveAccountModal } from '../../modals'
import { controlComputed, controlMethods } from '../../injectors'
import Statistic from './Statistic'

export default {
  components: {
    Statistic
  },
  data() {
    return {
      actions: [
        {
          icon: 'account-notes',
          onClick: this.getEncryptedNotes,
          button: 'account.control.loadAll',
          description: 'account.control.loadAllDesc'
        },
        {
          icon: 'account-key',
          onClick: this.openRecoverKeyModal,
          button: 'account.control.showRecoveryKey',
          description: 'account.control.showRecoveryKeyDesc'
        },
        {
          icon: 'account-remove',
          button: 'account.control.remove',
          onClick: this.handleRemoveAccount,
          description: 'account.control.removeDesc'
        }
      ]
    }
  },
  computed: {
    ...controlComputed
  },
  methods: {
    ...controlMethods,
    handleEnabledSaveFile() {
      this.enabledSaveFile()
    },
    async getEncryptedNotes() {
      const props = await this.decryptNotes()

      if (props) {
        openDecryptModal({ ...props, parent: this })
      }
    },
    handleRemoveAccount() {
      const onConfirm = () => {
        this.addNoticeWithInterval({
          notice: {
            title: 'accountHasBeenDeleted',
            type: 'info'
          },
          interval: 2000
        })
        this.removeAccount()
      }

      openRemoveAccountModal({ i18n: this.$i18n, onConfirm })
    },
    async openRecoverKeyModal() {
      const recoveryKey = await this.getRecoveryKey()

      if (recoveryKey) {
        openShowRecoverKeyModal({ recoveryKey, parent: this })
      }
    }
  }
}
</script>
