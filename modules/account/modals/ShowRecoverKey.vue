<template>
  <div class="modal-card box box-modal">
    <header class="box-modal-header is-spaced">
      <div class="box-modal-title">{{ $t('account.modals.showRecoveryKey.title') }}</div>
      <button type="button" class="delete" @click="$emit('close')" />
    </header>
    <div class="note">{{ $t('account.modals.showRecoveryKey.description') }}</div>
    <div class="field">
      <div class="label-with-buttons">
        <div class="label"></div>
        <b-button v-clipboard:copy="recoveryKey" v-clipboard:success="onCopy" type="is-primary-text">
          {{ $t('copy') }}
        </b-button>
      </div>
      <div class="notice is-recovery-key">
        <div class="notice__p">{{ recoveryKey }}</div>
      </div>
    </div>
    <b-button type="is-primary" outlined @click="onClose">
      {{ $t('account.modals.showRecoveryKey.close') }}
    </b-button>
  </div>
</template>

<script>
import { showRecoveryKeyMethods } from '../injectors'

export default {
  props: {
    recoveryKey: {
      type: String,
      required: true
    }
  },
  data() {
    return {}
  },
  computed: {},
  methods: {
    ...showRecoveryKeyMethods,
    onClose() {
      this.$emit('close')
    },
    onCopy() {
      this.addNoticeWithInterval({
        notice: {
          title: 'copied',
          type: 'info'
        },
        interval: 2000
      })
    }
  }
}
</script>
