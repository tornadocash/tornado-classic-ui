<template>
  <div class="modal-card box box-modal">
    <header class="box-modal-header is-spaced">
      <div class="box-modal-title">{{ $t('account.modals.recoverAccount.title') }}</div>
      <button type="button" class="delete" @click="$emit('close')" />
    </header>
    <div class="note">
      {{ $t('account.modals.recoverAccount.description') }}
    </div>
    <div class="field">
      <b-input
        v-model="recoveryKey"
        type="textarea"
        class="is-disabled-resize"
        rows="2"
        :placeholder="$t('enterRecoveryKey')"
        data-test="input_enter_recovery_key"
        :class="{ 'is-warning': hasAndValidKey }"
        @input="onInput"
      ></b-input>
      <p v-show="hasAndValidKey" class="help is-warning">
        {{ $t('account.modals.recoverAccount.warning') }}
      </p>
    </div>
    <b-notification
      v-if="recoverAccountFromKeyRequest.isError"
      class="main-notification"
      type="is-warning"
      :closable="false"
    >
      {{ recoverAccountFromKeyRequest.errorMessage }}
    </b-notification>
    <b-button
      type="is-primary is-fullwidth"
      :disabled="hasAndValidKey"
      :loading="recoverAccountFromKeyRequest.isFetching"
      data-test="button_connect_recovery_key"
      @click="handleRecoverAccount"
    >
      {{ $t('account.modals.recoverAccount.connect') }}
    </b-button>
  </div>
</template>

<script>
import { recoverAccountComputed, recoverAccountMethods } from '../injectors'
import { debounce } from '@/utils'

export default {
  props: {
    getNotes: {
      required: true,
      type: Function
    }
  },
  data() {
    return {
      recoveryKey: '',
      isValidRecoveryKey: true
    }
  },
  computed: {
    ...recoverAccountComputed,
    hasAndValidKey() {
      return this.recoveryKey && !this.isValidRecoveryKey
    }
  },
  beforeDestroy() {
    this.clearState({ key: 'recoverAccountFromKey' })
  },
  methods: {
    ...recoverAccountMethods,
    async handleRecoverAccount() {
      await this.recoverAccountFromKey({ recoveryKey: this.recoveryKey })
      this.$emit('close')
      await this.getNotes()
    },
    onInput(recoveryKey) {
      this.clearState({ key: 'recoverAccountFromKey' })
      debounce(this.checkPrivateKey, recoveryKey)
    },
    checkPrivateKey(recoveryKey) {
      try {
        this.$provider.web3.eth.accounts.privateKeyToAccount(recoveryKey)
        this.isValidRecoveryKey = true
      } catch {
        this.isValidRecoveryKey = false
      }
    }
  }
}
</script>
