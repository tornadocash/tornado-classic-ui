<template>
  <div class="modal-card box box-modal">
    <header class="box-modal-header is-spaced">
      <div class="box-modal-title">{{ $t('yourNote') }}</div>
      <button type="button" class="delete" @click="$emit('close')" />
    </header>
    <div class="note">
      <div>{{ $t('pleaseBackupYourNote') }}</div>
      <div>{{ $t('treatYourNote') }}</div>
    </div>
    <div class="znote">
      {{ prefix }}-{{ note }}
      <b-tooltip :label="tooltipCopy" position="is-top">
        <button
          v-clipboard:copy="`${prefix}-${note}`"
          v-clipboard:success="onCopy"
          class="button is-primary has-icon"
        >
          <span class="icon icon-copy"></span>
        </button>
      </b-tooltip>
      <b-tooltip :label="$t('saveNote')" position="is-top">
        <button class="button is-primary has-icon" @click="onSave">
          <span class="icon icon-save"></span>
        </button>
      </b-tooltip>
    </div>
    <div v-show="isEnabledSaveFile" class="note">
      {{ $t('saveAsFile') }} <span class="has-text-primary">{{ filename }}</span>
    </div>
    <template v-if="!isSetupAccount">
      <i18n tag="div" path="yourDontHaveAccount" class="notice">
        <template v-slot:account>
          <a @click="_redirectToAccount">{{ $t('account.button') }}</a>
        </template>
      </i18n>
    </template>
    <b-checkbox v-if="isSetupAccount" v-model="isEncrypted">
      <i18n v-show="isSetupAccount" tag="div" path="iEncryptedTheNote">
        <template v-slot:address>
          <b-tooltip :label="tooltipCopy" position="is-top">
            <a class="has-text-primary" @click.prevent.stop="copyNoteAccount">{{ getEncryptAccount }}</a>
          </b-tooltip>
        </template>
      </i18n>
    </b-checkbox>
    <template v-if="!isSetupAccount || !isEncrypted">
      <b-checkbox v-model="isBackuped" data-test="backup_note_checkbox">{{
        $t('iBackedUpTheNote')
      }}</b-checkbox>
      <div v-if="isBackuped && isIPFS" class="notice is-warning">
        <div class="notice__p">{{ $t('yourNoteWontBeSaved') }}</div>
      </div>
    </template>
    <connect-button v-if="!isLoggedIn" type="is-primary is-fullwidth" />
    <b-button
      v-else
      type="is-primary is-fullwidth"
      :disabled="disableButton"
      data-test="send_deposit_button"
      @click="_sendDeposit"
    >
      {{ $t('sendDeposit') }}
    </b-button>
  </div>
</template>
<script>
/* eslint-disable no-console */
import { mapActions, mapState, mapGetters } from 'vuex'

import { sliceAddress } from '@/utils'
import { ConnectButton } from '@/components/web3Connect'

export default {
  components: {
    ConnectButton
  },
  data() {
    return {
      isBackuped: false,
      tooltipCopy: this.$t('clickToCopy'),
      isEncrypted: false,
      copyTimer: null
    }
  },
  computed: {
    ...mapGetters('metamask', ['isLoggedIn']),
    ...mapGetters('txHashKeeper', ['addressExplorerUrl']),
    ...mapGetters('encryptedNote', ['isSetupAccount', 'accounts', 'isEnabledSaveFile']),
    ...mapState('application', ['note', 'prefix']),
    isIPFS() {
      return this.$isLoadedFromIPFS()
    },
    filename() {
      return `backup-${this.prefix}-${this.note.slice(0, 10)}.txt`
    },
    getEncryptAccount() {
      return sliceAddress(this.accounts.encrypt)
    },
    disableButton() {
      if (this.isBackuped) {
        return !this.isBackuped
      } else {
        return !this.isEncrypted || !this.isSetupAccount
      }
    }
  },
  beforeMount() {
    this.isEncrypted = this.isSetupAccount
  },
  beforeDestroy() {
    clearTimeout(this.copyTimer)
  },
  methods: {
    ...mapActions('application', ['sendDeposit', 'saveFile']),
    ...mapActions('encryptedNote', ['redirectToAccount']),
    onCopy() {
      this.tooltipCopy = this.$t('copied')
      this.copyTimer = setTimeout(() => {
        this.tooltipCopy = this.$t('clickToCopy')
      }, 1500)
    },
    onSave() {
      this.saveFile({ note: this.note, prefix: this.prefix })
    },
    _redirectToAccount() {
      this.redirectToAccount()
      this.$emit('close')
    },
    async _sendDeposit() {
      this.$store.dispatch('loading/enable', { message: this.$t('preparingTransactionData') })
      await this.sendDeposit({ isEncrypted: this.isEncrypted })
      this.$store.dispatch('loading/disable')
      this.$parent.close()
    },
    async copyNoteAccount() {
      await this.$copyText(this.accounts.encrypt)
      this.onCopy()
    }
  }
}
</script>
