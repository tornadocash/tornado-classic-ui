<template>
  <div class="modal-card box box-modal">
    <header class="box-modal-header is-spaced">
      <div class="box-modal-title">{{ $t('account.modals.setupAccount.title') }}</div>
      <button type="button" class="delete" @click="$emit('close')" />
    </header>
    <div class="note">{{ $t('account.modals.setupAccount.description') }}</div>
    <div class="field">
      <div class="label-with-buttons">
        <div class="label">{{ $t('account.modals.setupAccount.label') }}</div>
        <b-button v-clipboard:copy="recoveryKey" v-clipboard:success="onCopy" type="is-primary-text">
          {{ $t('copy') }}
        </b-button>
      </div>
      <div class="notice is-recovery-key">
        <div class="notice__p">{{ recoveryKey }}</div>
      </div>
    </div>
    <b-notification class="main-notification" type="is-info" :closable="false">
      {{ $t('account.modals.setupAccount.isNotSupportedWithHw') }}
    </b-notification>
    <b-checkbox v-model="isSaveOnChain" :disabled="isPartialSupport">{{
      $t('account.modals.setupAccount.saveOnChain')
    }}</b-checkbox>
    <b-checkbox v-if="!isSaveOnChain" v-model="isBackuped">{{
      $t('account.modals.setupAccount.backedUp')
    }}</b-checkbox>
    <b-notification
      v-if="!isSaveOnChain && warningMessage"
      class="main-notification"
      type="is-warning"
      :closable="false"
    >
      {{ warningMessage }}
    </b-notification>
    <b-notification
      v-if="setupAccountRequest.isError"
      class="main-notification"
      type="is-warning"
      :closable="false"
    >
      {{ setupAccountRequest.errorMessage }}
    </b-notification>
    <b-button
      v-if="!isBackuped && isSaveOnChain"
      type="is-primary is-fullwidth"
      data-test="button_confirm_setup_account"
      :loading="setupAccountRequest.isFetching"
      @click="onSetupAccount"
    >
      {{ $t('account.modals.setupAccount.setupAccount') }}
    </b-button>
    <b-button v-else type="is-primary is-fullwidth" :disabled="!isBackuped" @click="setAccount">
      {{ $t('account.modals.setupAccount.setAccount') }}
    </b-button>
  </div>
</template>

<script>
import { setupMethods, setupComputed } from '../injectors'

export default {
  data() {
    return {
      timer: null,
      recoveryKey: '',
      isBackuped: false,
      isSaveOnChain: true,
      warningMessage: ''
    }
  },
  computed: {
    ...setupComputed
  },
  watch: {
    isSaveOnChain() {
      if (this.isSaveOnChain) {
        this.isBackuped = false
      }
    }
  },
  beforeUpdate() {
    if (this.setupAccountRequest.isSuccess) {
      this.$parent.close()
    }
  },
  mounted() {
    this.recoveryKey = this.$provider.web3.eth.accounts.create().privateKey.slice(2)

    if (this.isPartialSupport) {
      this.isSaveOnChain = false
    }

    this.timer = setTimeout(() => {
      this.saveRecoveryKeyOnFile({ recoveryKey: this.recoveryKey })
    }, 1500)
  },
  beforeDestroy() {
    clearTimeout(this.timer)
    this.clearState({ key: 'setupAccount' })
  },
  methods: {
    ...setupMethods,
    onCopy() {
      this.addNoticeWithInterval({
        notice: {
          title: 'copied',
          type: 'info'
        },
        interval: 2000
      })
    },
    async setAccount() {
      try {
        await this.recoverAccountFromKey({ recoveryKey: this.recoveryKey })
        this.$emit('close')
      } catch (err) {
        this.warningMessage = err.message
      }
    },
    async onSetupAccount() {
      if (!this.isSaveOnChain) {
        this.warningMessage = this.$t('account.modals.setupAccount.yourRecoveryKeyWontBeSaved')
        return
      }

      try {
        await this.setupAccount({ privateKey: this.recoveryKey })
      } catch (err) {
        this.warningMessage = err.message
      }
    }
  }
}
</script>
