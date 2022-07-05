<template>
  <b-tab-item :label="$t('withdraw')" header-class="button_tab_withdraw">
    <div class="field">
      <div class="label-with-buttons">
        <div class="label">
          {{ $t('note') }}
          <b-tooltip
            :label="$t('noteTooltip')"
            size="is-small"
            position="is-right"
            multilined
            data-test="enter_note_info"
          >
            <button class="button is-primary has-icon">
              <span class="icon icon-info"></span>
            </button>
          </b-tooltip>
        </div>
        <a
          v-show="!hasErrorNote && depositTxHash"
          :href="txExplorerUrl(depositTxHash)"
          target="_blank"
          rel="noopener noreferrer"
          class="button is-icon"
        >
          <b-tooltip
            :label="$t('depositTransactionOnEtherscan')"
            size="is-small"
            position="is-left"
            multilined
          >
            <LinkIcon />
          </b-tooltip>
        </a>
        <button
          v-show="shouldSettingsShow"
          class="button is-icon"
          data-test="withdrawal_settings_button"
          @click="onSettings"
        >
          <b-tooltip :label="$t('withdrawalSettings')" size="is-small" position="is-right" multilined>
            <SettingsIcon />
          </b-tooltip>
        </button>
      </div>

      <b-input
        v-model="withdrawNote"
        :placeholder="$t('pleaseEnterYourNote')"
        :custom-class="hasErrorNote ? hasErrorNote.type : 'is-primary'"
        data-test="enter_note_field"
      ></b-input>
      <div v-if="hasErrorNote" class="help" :class="hasErrorNote.type">
        <!-- eslint-disable vue/no-v-html -->
        <p v-html="hasErrorNote.msg"></p>
      </div>
    </div>
    <div v-if="!hasErrorNote && depositTxHash" class="field field-withdraw">
      <div class="withdraw-data">
        <div class="withdraw-data-item">
          {{ $t('amount') }}
          <span data-test="note_tokens_amount">{{ selectedAmount }} {{ selectedStatisticCurrency }}</span>
        </div>
        <div class="withdraw-data-item">
          {{ $t('timePassed') }}
          <b-tooltip
            :active="notEnoughPassedTime"
            :label="$t('timePassedTooltip')"
            position="is-left"
            multilined
            size="is-large"
            :class="{ 'has-low-anonymity': notEnoughPassedTime }"
          >
            <span>{{ timePassed }}</span>
          </b-tooltip>
        </div>
        <div class="withdraw-data-item">
          {{ $t('subsequentDeposits') }}
          <b-tooltip
            :active="notEnoughDeposits"
            :label="$t('subsequentDepositsTooltip')"
            position="is-left"
            multilined
            size="is-large"
            :class="{ 'has-low-anonymity': notEnoughDeposits }"
          >
            <span>{{ this.$tc('userDeposit', depositsPast) }}</span>
          </b-tooltip>
        </div>
      </div>
    </div>
    <fieldset>
      <div class="field withdraw-address">
        <div class="label-with-buttons">
          <div class="label">
            <span class="name">
              {{ $t('recipientAddress') }}
            </span>
          </div>
          <button class="button is-primary-text" @click="insertDonate">
            {{ $t('donate') }}
          </button>
        </div>
        <b-input
          v-model="withdrawAddress"
          :placeholder="$t('pleasePasteAddressHere')"
          :size="!withdrawAddress ? '' : isValidAddress ? 'is-primary' : 'is-warning'"
          data-test="recipient_address_field"
        ></b-input>
        <p class="help">
          <span class="has-text-warning">{{ error.type }}</span> {{ error.message }}
        </p>
      </div>
      <RelayerTotal v-show="shouldShowRelayerTotal" />
      <WithdrawTotal
        v-show="shouldShowTotal"
        :currency="selectedStatisticCurrency"
        :withdraw-type="withdrawType"
        :eth-to-receive="ethToReceive"
      />
      <b-tooltip
        class="is-block"
        :label="`${$t(tooltipText)}`"
        position="is-top"
        :active="shouldTooltipShow"
        multilined
      >
        <b-button
          type="is-primary is-fullwidth"
          class="slide-animation"
          :outlined="isLoading"
          :expanded="isLoading"
          :class="{ 'slide-animation-active': isLoading }"
          :disabled="isWithdrawalButtonDisable"
          :loading="isLoadingRelayers || isLoading"
          data-test="button_start_withdraw"
          @click="onWithdraw"
        >
          {{ $t('withdrawButton') }}
        </b-button>
      </b-tooltip>
    </fieldset>
  </b-tab-item>
</template>
<script>
/* eslint-disable no-console */
import { mapState, mapGetters } from 'vuex'
import { getTornadoKeys } from '@/store/snark'

import { parseNote } from '@/utils'
import { DONATIONS_ADDRESS } from '@/constants'

import { LinkIcon, SettingsIcon } from '@/components/icons'
import RelayerTotal from '@/components/withdraw/RelayerTotal'
import WithdrawTotal from '@/components/withdraw/WithdrawTotal'
import WithdrawModalBox from '@/components/withdraw/WithdrawModalBox'
import SettingsModalBox from '@/components/settings/SettingsModalBox'

const { toChecksumAddress, isHexStrict, isAddress } = require('web3-utils')

export default {
  components: {
    LinkIcon,
    RelayerTotal,
    SettingsIcon,
    WithdrawTotal
  },
  props: {
    activeTab: {
      required: true,
      type: Number
    }
  },
  data() {
    return {
      withdrawAddress: '',
      withdrawNote: '',
      depositsPast: null,
      depositTxHash: null,
      depositTimestamp: null,
      isSpent: false,
      isLoading: false,
      isFileError: false,
      error: {
        type: null,
        message: ''
      },
      timePassed: ''
    }
  },
  computed: {
    ...mapState('application', ['note', 'errors', 'withdrawType', 'ethToReceive']),
    ...mapState('relayer', ['isLoadingRelayers']),
    ...mapGetters('txHashKeeper', ['txExplorerUrl']),
    ...mapGetters('application', ['isNotEnoughTokens', 'selectedStatisticCurrency']),
    ...mapGetters('metamask', ['networkConfig', 'netId', 'isLoggedIn', 'nativeCurrency']),
    notEnoughDeposits() {
      if (this.depositsPast < 5) {
        return true
      }
      return false
    },
    shouldSettingsShow() {
      return !this.hasErrorNote && !this.error.message
    },
    hasErrorNote() {
      const note = this.withdrawNote.split('-')[4]
      if (typeof WebAssembly === 'undefined') {
        return {
          type: 'is-warning',
          msg: this.$t('turnOnWasm')
        }
      }
      if (!this.withdrawNote) {
        return { type: '', msg: '' }
      }
      if (!note || note.length < 126 || !isHexStrict(note)) {
        return { type: 'is-warning', msg: this.$t('noteIsInvalid') }
      }
      if (this.isSpent) {
        return { type: 'is-warning', msg: this.$t('noteHasBeenSpent') }
      }
      return false
    },
    withDisconnectedWallet() {
      return this.withdrawType === 'wallet' && !this.isLoggedIn
    },
    shouldTooltipShow() {
      return (!this.isWithdrawDisabled && this.isNotEnoughTokens) || this.withDisconnectedWallet
    },
    tooltipText() {
      if (this.withDisconnectedWallet) {
        return 'withDisconnectedWallet'
      }
      return 'notEnoughTokens'
    },
    isValidAddress() {
      return isAddress(this.withdrawAddress)
    },
    notEnoughPassedTime() {
      return this.$moment().unix() - Number(this.depositTimestamp) < 86400 // less than 24 hours
    },
    hasWarning() {
      return this.depositsPast < 5 || this.notEnoughPassedTime
    },
    isWithdrawDisabled() {
      return (
        this.isLoading ||
        !!this.error.type ||
        this.hasErrorNote ||
        (this.withdrawType === 'relayer' && !this.selectedRelayer) ||
        !this.isValidAddress
      )
    },
    isWithdrawalButtonDisable() {
      return (
        this.isWithdrawDisabled || this.isNotEnoughTokens || this.isFileError || this.withDisconnectedWallet
      )
    },
    selectedRelayer() {
      return this.$store.state.relayer.selectedRelayer.name
    },
    selectedAmount() {
      return this.$store.state.application.selectedStatistic.amount
    },
    tokens() {
      return this.networkConfig.tokens
    },
    shouldShowTotal() {
      return this.isValidAddress && !this.isWithdrawDisabled
    },
    shouldShowRelayerTotal() {
      return this.withdrawType === 'relayer' && this.shouldShowTotal
    }
  },
  watch: {
    netId(netId, oldNetId) {
      if (netId !== oldNetId) {
        const [, , , noteNetId] = this.withdrawNote.split('-')

        if (Number(noteNetId) !== netId && noteNetId) {
          this.error = {
            type: this.$t('error'),
            message: this.$t('changeNetworkNote')
          }
        } else {
          this.error = {
            type: '',
            message: ''
          }
        }
      }
    },
    errors: {
      handler(errors) {
        console.log('error', errors)
        this.error = {
          type: errors.length ? this.$t('error') : null,
          message: errors[errors.length - 1]
        }
        if (this.error.message) {
          this.$store.dispatch('notice/addNoticeWithInterval', {
            notice: {
              untranslatedTitle: this.error.message,
              type: 'warning'
            }
          })
        }
      },
      deep: true
    },
    withdrawNote: {
      async handler(withdrawNote) {
        this.error = {
          type: '',
          message: ''
        }

        try {
          this.$store.dispatch('loading/enable', { message: this.$t('gettingTheNoteData') })
          this.isSpent = false
          this.depositsPast = null
          this.depositTxHash = null
          this.depositTimestamp = null

          if (!this.hasErrorNote) {
            const [tornadoPrefix, currency, amount, noteNetId, note] = this.withdrawNote.split('-')
            if (tornadoPrefix !== 'tornado') {
              this.$store.dispatch('loading/disable')
              this.withdrawNote = `tornado-${currency}-${amount}-${noteNetId}-${note}`
              return
            }
            this.getLogs(withdrawNote)
            this.$store.commit('application/SET_WITHDRAW_NOTE', withdrawNote)
            const netIdMissmatch = Number(noteNetId) !== Number(this.netId)

            if (netIdMissmatch) {
              throw new Error(this.$t('changeNetworkNote'))
            }

            const event = await this.$store.dispatch('application/loadDepositEvent', { withdrawNote })

            if (!event) {
              throw new Error(this.$t('thereIsNoRelatedDeposit'))
            }

            const { timestamp, txHash, isSpent, depositsPast = 0 } = event

            if (isSpent) {
              this.$store.dispatch('notice/addNoticeWithInterval', {
                notice: {
                  title: 'noteWasAlreadySpent',
                  type: 'warning'
                },
                interval: 5000
              })
            }
            this.$store.dispatch('application/setAndUpdateStatistic', { currency, amount: Number(amount) })
            if (currency !== this.nativeCurrency) {
              this.$store.dispatch('application/setDefaultEthToReceive', { currency })
            }
            this.depositsPast = Number(depositsPast) <= 0 ? 0 : depositsPast
            this.depositTxHash = txHash
            this.depositTimestamp = timestamp
            this.isSpent = isSpent
          }
        } catch (err) {
          this.error = {
            type: this.$t('error'),
            message: err.message
          }
        } finally {
          this.$store.dispatch('loading/disable')
        }
      }
    },
    '$i18n.locale'() {
      this.timePastToRender()
    },
    depositTimestamp() {
      this.timePastToRender()
    },
    activeTab(newTab, oldTab) {
      if (newTab !== oldTab && newTab === 1) {
        this.withdrawAddress = ''
        this.withdrawNote = ''
        this.error = {
          type: '',
          message: ''
        }
      }
    }
  },
  created() {
    this.$emit('get-key', this.getKeys)
  },
  mounted() {
    this.$root.$on('resetWithdraw', () => {
      this.withdrawAddress = ''
      this.withdrawNote = ''
    })
  },
  methods: {
    async getKeys() {
      try {
        this.isFileError = false
        this.isLoading = true
        this.getProgress(0)
        await getTornadoKeys(this.getProgress)
        return true
      } catch (err) {
        console.error('getKeys has error:', err.message)

        this.$store.dispatch(
          'notice/addNoticeWithInterval',
          {
            notice: {
              title: 'fetchFile',
              type: 'warning'
            }
          },
          { root: true }
        )
        this.error = {
          type: this.$t('downloadError'),
          message: this.$t('fetchFile')
        }
        this.isFileError = true
      } finally {
        this.isLoading = false
      }
    },
    getProgress(value) {
      document.documentElement.style.setProperty('--width-animation', `${value}%`)
    },
    getLogs(note) {
      try {
        if (!note) {
          return
        }

        const { commitmentHex, nullifierHex } = parseNote(note)

        console.log('\n\nYOUR NOTE DATA:')
        console.log('note:', note)

        console.log('commitment:', commitmentHex)
        console.log('nullifierHash:', nullifierHex)
      } catch (err) {
        console.log(`Get logs: ${err.message}`)
      }
    },
    onWithdraw() {
      const note = this.withdrawNote.split('-')[4]
      if (note.length !== 126) {
        this.error = {
          type: this.$t('validationError'),
          message: this.$t('noteIsInvalid')
        }
        return
      }
      try {
        this.withdrawAddress = toChecksumAddress(this.withdrawAddress)
        this.$store.dispatch('application/prepareWithdraw', {
          note: this.withdrawNote,
          recipient: this.withdrawAddress
        })
        this.error.type = null
        this.currentModal = this.$buefy.modal.open({
          parent: this,
          component: WithdrawModalBox,
          hasModalCard: true,
          width: 440,
          props: {
            note: this.withdrawNote,
            withdrawType: this.withdrawType
          }
        })
      } catch (e) {
        this.error = {
          type: this.$t('validationError'),
          message: this.$t('recipientAddressIsInvalid')
        }
        console.error('error', e)
      }
    },
    onSettings() {
      this.$buefy.modal.open({
        parent: this,
        component: SettingsModalBox,
        hasModalCard: true,
        width: 440,
        props: {
          currency: this.selectedStatisticCurrency
        },
        customClass: 'is-pinned'
      })
    },
    timePastToRender() {
      this.timePassed = this.$moment.unix(this.depositTimestamp).fromNow(true)
    },
    insertDonate() {
      this.withdrawAddress = DONATIONS_ADDRESS
    }
  }
}
</script>
<style lang="scss" scoped>
:root {
  --width-animation: 0;
}

.slide-animation {
  position: relative;

  &:before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    width: var(--width-animation);
    height: 100%;
    background-color: #94febf;
    animation-fill-mode: backwards;
  }

  ::v-deep span {
    position: relative;
    z-index: 2;
  }

  &-active {
    ::v-deep span,
    &:after {
      filter: invert(0.5);
    }
  }
}
</style>
