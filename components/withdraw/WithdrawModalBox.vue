<template>
  <div class="modal-card box box-modal">
    <header class="box-modal-header is-spaced">
      <div class="box-modal-title">{{ $t('withdrawalConfirmation') }}</div>
      <button type="button" class="delete" @click="$emit('close')" />
    </header>
    <div class="note" data-test="withdrawal_confirmation_text">
      {{ $t('yourZkSnarkProofHasBeenSuccesfullyGenerated') }}
    </div>
    <b-button type="is-primary is-fullwidth" data-test="withdrawal_confirm_button" @click="_sendWithdraw">
      {{ $t('confirm') }}
    </b-button>
  </div>
</template>
<script>
/* eslint-disable no-console */

export default {
  props: {
    note: {
      type: String,
      required: true
    },
    withdrawType: {
      type: String,
      required: true
    }
  },
  computed: {
    withdrawalMethod() {
      if (this.withdrawType === 'wallet') {
        return 'application/withdraw'
      }

      return 'relayer/relayTornadoWithdraw'
    }
  },
  methods: {
    async _sendWithdraw() {
      this.$store.dispatch('loading/enable', { message: this.$t('preparingTransactionData') })

      try {
        await this.$store.dispatch(this.withdrawalMethod, {
          note: this.note
        })
        this.$root.$emit('resetWithdraw')
      } catch (e) {
        console.error(e)
        this.$store.dispatch('notice/addNoticeWithInterval', {
          notice: {
            untranslatedTitle: e.message,
            type: 'danger'
          },
          interval: 3000
        })
      } finally {
        this.$store.dispatch('loading/disable')
        this.$parent.close()
      }
    }
  }
}
</script>
