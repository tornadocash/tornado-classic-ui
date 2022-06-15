<template>
  <div
    class="box box-tx is-encrypted"
    :class="{
      'is-waiting': isWaiting,
      'is-danger': isFailed,
      'is-spent': tx.isSpent
    }"
  >
    <b-tooltip
      :label="$t('lockTooltip', { address: getOwner })"
      position="is-right"
      class="lock-tooltip"
      multilined
    >
      <div class="lock"></div>
    </b-tooltip>
    <div class="columns is-vcentered">
      <div class="column is-time" :data-label="$t('timePassed')">{{ time }}</div>
      <div class="column is-amount" :data-label="$t('amount')">
        <NumberFormat :value="amount" />
        {{ currency }}
      </div>
      <div class="column is-deposit" :data-label="$t('subsequentDeposits')">
        <b-skeleton v-if="mixingPower === 'loading'" width="80" />
        <template v-else>
          {{ mixingPower }}
        </template>
      </div>
      <div class="column is-hash" :data-label="$t('txHash')">
        <div class="details">
          <p class="detail">
            <a
              data-test="txhash_text"
              class="detail-description"
              :href="txExplorerUrl(tx.txHash)"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ tx.txHash }}
            </a>
          </p>
        </div>
      </div>
      <div class="column is-status" :data-label="$t('status')">{{ status }}</div>

      <div class="column column-buttons">
        <b-tooltip :active="activeCopyTooltip" :label="tooltipCopy" position="is-left" multilined>
          <b-button
            type="is-primary hide-icon-desktop"
            data-test="decrypt_note_button"
            size="is-small"
            icon-left="decrypt"
            :disabled="disableCopyButton"
            @click="onCopyAndDecrypt"
          >
            {{ $t('decrypt') }}
          </b-button>
        </b-tooltip>
        <b-button
          type="is-dark"
          data-test="remove_note_button"
          size="is-small"
          icon-right="remove"
          @click="onClose"
        />
      </div>
    </div>
  </div>
</template>
<script>
/* eslint-disable no-console */
import { decrypt } from 'eth-sig-util'
import { mapGetters, mapState, mapActions } from 'vuex'
import { toChecksumAddress, isAddress } from 'web3-utils'

import txStatus from '@/store/txStatus'
import NumberFormat from '@/components/NumberFormat'
import { sliceAddress, unpackEncryptedMessage } from '@/utils'

export default {
  components: {
    NumberFormat
  },
  props: {
    tx: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      time: '',
      isSpent: false,
      timer: null
    }
  },
  computed: {
    ...mapGetters('txHashKeeper', ['txExplorerUrl']),
    ...mapGetters('metamask', ['networkConfig', 'nativeCurrency']),
    ...mapGetters('token', ['toDecimals', 'getSymbol']),
    ...mapGetters('encryptedNote', ['isSetupAccount', 'accounts']),
    ...mapState('application', ['statistic']),
    ...mapState('metamask', ['ethAccount']),
    prefix() {
      let prefix = this.tx.prefix || ''
      prefix = prefix.split('-')
      return { currency: prefix[1], amount: prefix[2] }
    },
    activeCopyTooltip() {
      return !!this.tx.note || !this.isSetupAccount || !this.checkDecryptNote
    },
    disableCopyButton() {
      return !this.tx.note || !this.isSetupAccount || !this.checkDecryptNote
    },
    tooltipCopy() {
      if (!this.checkDecryptNote) {
        return this.getBackupAccount
          ? this.$t('notDecryptedWithBackup', { address: this.getOwner, backup: this.getBackupAccount })
          : this.$t('notDecrypted', { address: this.getOwner })
      }
      if (!this.isSetupAccount) {
        return this.$t('pleaseSetUpAccount')
      }
      return this.$t('decryptCopyNote')
    },
    checkDecryptNote() {
      if (isAddress(this.ethAccount)) {
        if (
          this.checkSumAddress(this.ethAccount) === this.checkSumAddress(this.accounts.backup) &&
          this.checkSumAddress(this.tx.backupAccount) === this.checkSumAddress(this.ethAccount)
        ) {
          return true
        }
      }

      const unpackedMessage = unpackEncryptedMessage(this.tx.note)
      const result = this.$sessionStorage.getItem(this.accounts.encrypt)

      if (!result) {
        return false
      }

      try {
        decrypt(unpackedMessage, result.data).split('-')

        return true
      } catch {
        return false
      }
    },
    amount() {
      if (this.tx.amount === '100000000000000000') {
        return this.toDecimals(this.tx.amount, 18)
      }
      return this.tx.amount
    },
    currency() {
      const { currency } = this.prefix
      return this.getSymbol(currency || this.tx.currency)
    },
    mixingPower() {
      if (!this.tx.index) {
        return '-'
      }
      if (this.tx.index === 'v1') {
        return this.$t('v1Deposit')
      }
      const { currency, amount } = this.prefix
      const nextDepositIndex = this.statistic[currency][amount].nextDepositIndex
      if (this.tx.status === txStatus.waitingForReciept || !nextDepositIndex) {
        return 'loading'
      } else if (this.tx.status === txStatus.fail) {
        return '-'
      } else {
        const depositsPast = this.statistic[currency][amount].nextDepositIndex - this.tx.index - 1
        return this.depositsPastToRender(depositsPast)
      }
    },
    status() {
      if (this.isWaiting) {
        return this.$t('waitingForReceipt')
      }
      if (this.isFailed) {
        return this.$t('failed')
      }
      if (this.tx.isSpent) {
        return this.$t('spent')
      }
      return this.$t('deposited')
    },
    isWaiting() {
      return this.tx.status === txStatus.waitingForReciept
    },
    isFailed() {
      return this.tx.status === txStatus.fail
    },
    getOwner() {
      return this.tx.owner ? sliceAddress(this.tx.owner) : ''
    },
    getBackupAccount() {
      return this.tx.backupAccount ? sliceAddress(this.tx.backupAccount) : ''
    }
  },
  mounted() {
    this.update()
  },
  beforeDestroy() {
    clearTimeout(this.timer)
  },
  methods: {
    ...mapActions('encryptedNote', ['decryptNote']),
    checkSumAddress(address) {
      return isAddress(address) ? toChecksumAddress(address) : ''
    },
    async onCopyAndDecrypt() {
      const note = await this.decryptNote(this.tx.note)

      if (note) {
        this.$copyText(`${this.tx.prefix}-${note}`)

        this.$store.dispatch('notice/addNoticeWithInterval', {
          notice: {
            title: 'copied',
            type: 'info'
          },
          interval: 2000
        })
      }
    },
    update() {
      this.updateTime()

      this.timer = setTimeout(() => {
        this.update()
      }, 10000)
    },
    onClose() {
      this.$buefy.dialog.confirm({
        title: this.$t('removeFromCache'),
        type: 'is-primary is-outlined',
        message: this.$t('pleaseMakeSureYouHaveBackedUpYourNote'),
        cancelText: this.$t('cancelButton'),
        confirmText: this.$t('remove'),
        onConfirm: () => {
          this.$store.dispatch('notice/addNoticeWithInterval', {
            notice: {
              title: 'noteHasBeenDeleted',
              type: 'info'
            },
            interval: 2000
          })
          this.$store.commit('txHashKeeper/DELETE_TX', { storeType: 'encryptedTxs', txHash: this.tx.txHash })
        }
      })
    },
    updateTime(t = this.tx.timestamp) {
      this.time = this.$moment.unix(t).fromNow()
    },
    depositsPastToRender(depositsPast) {
      if (depositsPast < 0) {
        return 'loading'
      }

      return this.$tc('userDeposit', depositsPast)
    }
  }
}
</script>
