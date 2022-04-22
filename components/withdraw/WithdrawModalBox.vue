<template>
  <div class="modal-card box box-modal">
    <header class="box-modal-header is-spaced">
      <div class="box-modal-title">{{ $t('withdrawalConfirmation') }}</div>
      <button type="button" class="delete" @click="$emit('close')" />
    </header>
    <div class="note">
      {{ message }}
    </div>
    <b-button type="is-primary is-fullwidth" @click="_sendWithdraw">
      {{ $t('confirm') }}
    </b-button>
  </div>
</template>
<script>
/* eslint-disable no-console */
import { mapState } from 'vuex'

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
  data() {
    return {
      message: ''
    }
  },
  computed: {
    ...mapState('application', ['notes', 'errors']),
    withdrawalMethod() {
      if (this.withdrawType === 'wallet') {
        return 'application/withdraw'
      }

      return 'relayer/relayTornadoWithdraw'
    }
  },
  watch: {
    notes(newNotes) {
      if (newNotes[this.note]) {
        this.$store.dispatch('loading/disable')
        this.message = this.$t('yourZkSnarkProofHasBeenSuccesfullyGenerated')
      }
    },
    errors: {
      handler(type) {
        this.$store.dispatch('loading/disable')
        this.$parent.close()
      },
      deep: true
    }
  },
  mounted() {
    this.$store.dispatch('loading/enable', { message: this.$t('generatingProof') })
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
