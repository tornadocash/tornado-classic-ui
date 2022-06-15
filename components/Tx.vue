<template>
  <div
    class="box box-tx"
    :class="{
      'is-waiting': isWaiting,
      'is-danger': isFailed,
      'is-spent': tx.isSpent
    }"
  >
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
              class="detail-description"
              data-test="txhash_text"
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
        <b-tooltip :active="!!tx.note" :label="tooltipShareUrl" position="is-left">
          <b-button
            v-clipboard:copy="`${tx.prefix}-${tx.note}`"
            v-clipboard:success="onCopyLink"
            type="is-primary hide-text-touch"
            size="is-small"
            :disabled="!tx.note"
            icon-left="copy"
            data-test="copy_note_button"
          >
            {{ $t('note') }}
          </b-button>
        </b-tooltip>
        <b-button
          data-test="remove_note_button"
          type="is-dark"
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
import { mapGetters, mapState } from 'vuex'
import txStatus from '../store/txStatus'
import NumberFormat from '@/components/NumberFormat'
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
      tooltipShareUrl: this.$t('copyNote'),
      time: '',
      isSpent: false,
      timer: null,
      copyTimer: null
    }
  },
  computed: {
    ...mapGetters('txHashKeeper', ['txExplorerUrl']),
    ...mapGetters('metamask', ['networkConfig', 'nativeCurrency']),
    ...mapGetters('token', ['toDecimals', 'getSymbol']),
    ...mapState('application', ['statistic']),
    prefix() {
      let prefix = this.tx.prefix || ''
      prefix = prefix.split('-')
      return { currency: prefix[1], amount: prefix[2] }
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
    }
  },
  mounted() {
    this.update()
  },
  beforeDestroy() {
    clearTimeout(this.timer)
    clearTimeout(this.copyTimer)
  },
  methods: {
    update() {
      this.updateTime()

      this.timer = setTimeout(() => {
        this.update()
      }, 10000)
    },
    onCopyLink() {
      this.tooltipShareUrl = this.$t('copied')
      this.copyTimer = setTimeout(() => {
        this.tooltipShareUrl = this.$t('copyNote')
      }, 1500)
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
          this.$store.commit('txHashKeeper/DELETE_TX', { txHash: this.tx.txHash })
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
