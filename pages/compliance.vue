<template>
  <div class="compliance">
    <h1 class="title is-size-1 is-size-2-mobile is-spaced">
      Tornado.cash <span class="not-print">{{ $t('complianceTool') }}</span>
      <span class="print">{{ $t('complianceReport') }}</span>
    </h1>
    <p class="p is-size-6">
      <i18n path="complianceSubtitle">
        <template v-slot:newline><br /></template>
      </i18n>
    </p>
    <div class="field">
      <div class="label">{{ $t('note') }}</div>
      <b-input
        v-model="withdrawNote"
        data-test="input_enter_note_for_compliance"
        :placeholder="$t('pleaseEnterYourNote')"
        :custom-class="error ? error.type : 'is-primary'"
      ></b-input>
      <div class="print-help">{{ withdrawNote }}</div>
      <p v-show="error.msg !== ''" class="help" :class="error.type">{{ error.msg }}</p>
    </div>

    <div v-show="withdrawNote && error.msg === ''">
      <b-notification
        :active="!txDepositInfo.isSpent && loaded"
        class="main-notification"
        type="is-warning"
        icon-pack="icon"
        has-icon
        :closable="false"
      >
        <strong>{{ $t('warning') }}</strong> {{ $t('doNotShareYouNote') }}
      </b-notification>
      <div class="columns columns-blocks is-desktop is-gapless">
        <div class="column is-5-desktop">
          <div class="block">
            <h3 class="block-item block-item--title">
              {{ $t('deposit') }}
              <span>{{
                txDepositInfo.amount
                  ? `${$n(txDepositInfo.amount)} ${getSymbol(txDepositInfo.currency)}`
                  : '-'
              }}</span>
            </h3>
            <div
              class="block-item block-item--status"
              data-test="note_status_info"
              :class="{
                'is-success': txDepositInfo.txHash
              }"
            >
              {{ txDepositInfo.txHash ? $t('verified') : $t('status') }}
            </div>
            <div class="block-item block-item--data">
              <div class="label">{{ $t('date') }}</div>
              <div class="value">
                {{
                  txDepositInfo.timestamp
                    ? `${this.$moment
                        .unix(txDepositInfo.timestamp)
                        .utc()
                        .format('lll')} +UTC`
                    : '-'
                }}
              </div>
            </div>
            <div class="block-item block-item--data">
              <div class="label">{{ $t('transaction') }}</div>
              <a
                v-if="txDepositInfo.txHash"
                :href="txExplorerUrl(txDepositInfo.txHash)"
                target="_blank"
                rel="noopener noreferrer"
                class="value"
                :data-value="txDepositInfo.txHash"
              >
                {{ hashRender(txDepositInfo.txHash) }}
              </a>
              <div v-else class="value">-</div>
            </div>
            <div class="block-item block-item--data">
              <div class="label">{{ $t('from') }}</div>
              <a
                v-if="txDepositInfo.txHash"
                :href="addressExplorerUrl(txDepositInfo.from)"
                target="_blank"
                rel="noopener noreferrer"
                class="value"
              >
                {{ txDepositInfo.from }}
              </a>
              <div v-else class="value">-</div>
            </div>
            <div class="block-item block-item--data">
              <div class="label">{{ $t('commitment') }}</div>
              <div
                v-if="txDepositInfo.commitment"
                v-clipboard:copy="txDepositInfo.commitment"
                v-clipboard:success="onCopy"
                class="value copy"
                :data-value="txDepositInfo.commitment"
              >
                {{ hashRender(txDepositInfo.commitment) }}
              </div>
              <div v-else class="value">-</div>
            </div>
          </div>
        </div>
        <div class="column is-2-desktop">
          <div class="arrow"></div>
        </div>
        <div class="column is-5-desktop">
          <div class="block block-withdrawal">
            <h3 class="block-item block-item--title">
              {{ $t('withdrawal') }}
              <span>{{
                txWithdrawalInfo.amount
                  ? `${$n(txWithdrawalInfo.amount)} ${getSymbol(txDepositInfo.currency)}`
                  : '-'
              }}</span>
            </h3>
            <div
              class="block-item block-item--status"
              data-test="info_withdrawal_status"
              :class="{
                'is-warning': !txDepositInfo.isSpent,
                'is-success': txWithdrawalInfo.txHash
              }"
            >
              {{
                txDepositInfo.isSpent
                  ? txWithdrawalInfo.txHash
                    ? $t('verified')
                    : $t('status')
                  : $t('noteHasNotBeenSpent')
              }}
              <span class="fee">{{
                txWithdrawalInfo.fee
                  ? `${$t('relayerFee')} ${$n(txWithdrawalInfo.fee)} ${getSymbol(txDepositInfo.currency)}`
                  : $t('relayerFee')
              }}</span>
            </div>
            <div class="block-item block-item--data">
              <div class="label">{{ $t('date') }}</div>
              <div class="value">
                {{
                  txWithdrawalInfo.timestamp
                    ? `${this.$moment
                        .unix(txWithdrawalInfo.timestamp)
                        .utc()
                        .format('lll')} +UTC`
                    : '-'
                }}
              </div>
            </div>
            <div class="block-item block-item--data">
              <div class="label">{{ $t('transaction') }}</div>
              <a
                v-if="txWithdrawalInfo.txHash"
                :href="txExplorerUrl(txWithdrawalInfo.txHash)"
                target="_blank"
                rel="noopener noreferrer"
                class="value"
                :data-value="txWithdrawalInfo.txHash"
              >
                {{ hashRender(txWithdrawalInfo.txHash) }}
              </a>
              <div v-else class="value">-</div>
            </div>
            <div class="block-item block-item--data">
              <div class="label">{{ $t('to') }}</div>
              <a
                v-if="txWithdrawalInfo.to"
                :href="addressExplorerUrl(txWithdrawalInfo.to)"
                target="_blank"
                rel="noopener noreferrer"
                class="value"
              >
                {{ txWithdrawalInfo.to }}
              </a>
              <div v-else class="value">-</div>
            </div>
            <div class="block-item block-item--data">
              <div class="label">{{ $t('nullifierHash') }}</div>
              <div
                v-if="txWithdrawalInfo.nullifier"
                v-clipboard:copy="txWithdrawalInfo.nullifier"
                v-clipboard:success="onCopy"
                class="value copy"
                :data-value="txWithdrawalInfo.nullifier"
              >
                {{ hashRender(txWithdrawalInfo.nullifier) }}
              </div>
              <div v-else class="value">-</div>
            </div>
          </div>
        </div>
      </div>
      <div class="columns is-desktop is-vcentered is-gapless has-verified">
        <div class="column is-5-desktop"></div>
        <div class="column is-2-desktop generate-container">
          <b-button
            v-show="txDepositInfo.txHash && txWithdrawalInfo.txHash"
            type="is-primary"
            class="generate"
            outlined
            @click="print"
            >{{ $t('generatePdfReport') }}</b-button
          >
        </div>
        <div class="column is-5-desktop">
          <Verified v-show="txDepositInfo.txHash" />
        </div>
      </div>
    </div>
    <div class="print print-title">{{ $t('warning') }}</div>
    <div class="print print-p">
      <i18n path="compliancePrintWarning">
        <template v-slot:newline><br /></template>
      </i18n>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-console */
import Web3 from 'web3'
import { mapGetters } from 'vuex'

import networkConfig from '@/networkConfig'
import { parseNote, hashRender } from '@/utils'
import Verified from '@/components/icons/Verified'

const { isHexStrict } = require('web3-utils')

export default {
  components: {
    Verified
  },
  data() {
    return {
      withdrawNote: '',
      error: { type: '', msg: '' },
      txDepositInfo: {
        amount: null,
        currency: '',
        isSpent: false,
        timestamp: null,
        txHash: '',
        from: ''
      },
      loaded: false,
      txWithdrawalInfo: {
        amount: null,
        txHash: '',
        timestamp: null,
        to: '',
        nullifier: '',
        fee: null
      }
    }
  },
  computed: {
    ...mapGetters('settings', ['currentRpc']),
    ...mapGetters('metamask', ['netId']),
    ...mapGetters('token', ['getSymbol']),
    config() {
      return networkConfig[`netId${this.netId}`]
    },
    getEthInstance() {
      const web3 = new Web3(this.currentRpc.url)
      return web3.eth
    }
  },
  watch: {
    netId(netId, oldNetId) {
      if (netId !== oldNetId) {
        const [, , , noteNetId] = this.withdrawNote.split('-')

        if (Number(noteNetId) !== netId && noteNetId) {
          this.error = {
            type: 'is-warning',
            msg: this.$t('changeNetworkNote')
          }
        } else {
          this.resetState()
        }
      }
    },
    withdrawNote: {
      async handler(withdrawNote) {
        try {
          this.resetState()
          this.$store.dispatch('loading/enable', { message: this.$t('gettingTheNoteData') })
          if (!withdrawNote) {
            throw new Error('enterYourDepositsNote')
          }

          const [, currency, amount, noteNetId, note] = withdrawNote.split('-')
          if (!note || note.length < 126 || !isHexStrict(note)) {
            throw new Error('noteIsInvalid')
          }

          if (Number(this.netId) !== Number(noteNetId)) {
            throw new Error('changeNetworkNote')
          }

          const event = await this.$store.dispatch('application/loadDepositEvent', { withdrawNote })

          if (!event) {
            throw new Error('thereIsNoRelatedDeposit')
          }

          const { timestamp, txHash, isSpent } = event

          const receipt = await this.getTransactionReceipt(txHash)

          const { nullifierHex, commitmentHex } = parseNote(withdrawNote)

          this.txDepositInfo = {
            currency,
            amount,
            isSpent,
            txHash,
            timestamp,
            from: receipt.from,
            commitment: commitmentHex
          }

          if (isSpent) {
            const { withdrawalBlock, txHash, to, fee, amount } = await this.$store.dispatch(
              'application/loadWithdrawalData',
              {
                withdrawNote
              }
            )

            const { timestamp } = await this.getBlock(withdrawalBlock)

            this.txWithdrawalInfo = {
              amount,
              txHash,
              timestamp,
              to,
              nullifier: nullifierHex,
              fee
            }
          }
          this.loaded = true
        } catch (e) {
          console.error(e)
          this.error = { type: 'is-warning', msg: this.$t(e.message) }
        } finally {
          this.$store.dispatch('loading/disable')
        }
      }
    }
  },
  methods: {
    getTransactionReceipt(txHash) {
      return this.getEthInstance.getTransactionReceipt(txHash)
    },
    getBlock(blockHash) {
      return this.getEthInstance.getBlock(blockHash)
    },
    txExplorerUrl(txHash) {
      const { explorerUrl } = this.config
      return explorerUrl.tx + txHash
    },
    addressExplorerUrl(address) {
      const { explorerUrl } = this.config
      return explorerUrl.address + address
    },
    print() {
      // window.print()

      if (process.server) {
        return
      }

      const JsPdf = require('jspdf')
      const doc = new JsPdf()

      doc
        .setFontSize(9)
        .setLineHeightFactor(1.5)
        .setFont('courier')
        .setFontStyle('normal')

      const width = doc.internal.pageSize.getWidth()
      const padding = 10
      const endX = width - padding
      const splitLineSize = width - padding * 2
      const splitColumnSize = (width - padding * 3) / 2
      const endFirstColumnX = splitColumnSize + padding
      const startSecondColumnX = splitColumnSize + padding * 2

      const depositAmount = `${this.$n(this.txDepositInfo.amount)} ${this.getSymbol(
        this.txDepositInfo.currency
      )}`
      const withdrawalAmount = `${this.$n(this.txWithdrawalInfo.amount)} ${this.getSymbol(
        this.txDepositInfo.currency
      )}`
      const fee = `${this.$t('relayerFee', 'en')} ${this.$n(this.txWithdrawalInfo.fee)} ${this.getSymbol(
        this.txDepositInfo.currency
      )}`

      // save current moment locale
      const locale = this.$moment.locale()
      this.$moment.locale('en')
      const depositDate = `${this.$moment
        .unix(this.txDepositInfo.timestamp)
        .utc()
        .format('lll')} +UTC`
      const withdrawDate = `${this.$moment
        .unix(this.txWithdrawalInfo.timestamp)
        .utc()
        .format('lll')} +UTC`

      // return the previous moment locale
      this.$moment.locale(locale)

      const depositTx = doc.splitTextToSize(this.txDepositInfo.txHash, splitColumnSize)
      const withdrawTx = doc.splitTextToSize(this.txWithdrawalInfo.txHash, splitColumnSize)
      const commitment = doc.splitTextToSize(this.txDepositInfo.commitment, splitColumnSize)
      const nullifier = doc.splitTextToSize(this.txWithdrawalInfo.nullifier, splitColumnSize)
      const note = doc.splitTextToSize(this.withdrawNote, splitLineSize)
      const complianceWarning = doc.splitTextToSize(
        this.$t('compliancePrintWarning', 'en', { newline: '\n' }),
        splitLineSize
      )

      doc.text(this.$t('note', 'en'), padding, 50)
      doc.text(this.$t('date', 'en'), padding, 91)
      doc.text(this.$t('date', 'en'), startSecondColumnX, 91)
      doc.text(this.$t('transaction', 'en'), padding, 106)
      doc.text(this.$t('transaction', 'en'), startSecondColumnX, 106)
      doc.text(this.$t('from', 'en'), padding, 126)
      doc.text(this.$t('to', 'en'), startSecondColumnX, 126)
      doc.text(this.$t('commitment', 'en'), padding, 141)
      doc.text(this.$t('nullifierHash', 'en'), startSecondColumnX, 141)
      doc.text(complianceWarning, padding, 209)

      doc.setFontStyle('bold').text(note, padding, 56)
      doc.text(depositDate, padding, 97)
      doc.text(withdrawDate, startSecondColumnX, 97)

      const links = [
        { text: depositTx, x: padding, y: 112, url: this.txExplorerUrl(this.txDepositInfo.txHash) },
        {
          text: withdrawTx,
          x: startSecondColumnX,
          y: 112,
          url: this.txExplorerUrl(this.txWithdrawalInfo.txHash)
        },
        {
          text: this.txDepositInfo.from,
          x: padding,
          y: 132,
          url: this.addressExplorerUrl(this.txDepositInfo.from)
        },
        {
          text: this.txWithdrawalInfo.to,
          x: startSecondColumnX,
          y: 132,
          url: this.addressExplorerUrl(this.txWithdrawalInfo.to)
        }
      ]

      for (const { text, x, y, url } of links) {
        if (Array.isArray(text)) {
          for (let i = 0; i < text.length; i++) {
            doc.textWithLink(text[i], x, y + i * 4.8, {
              url
            })
          }
        } else {
          doc.textWithLink(text, x, y, {
            url
          })
        }
      }

      doc.text(commitment, padding, 147)
      doc.text(nullifier, startSecondColumnX, 147)

      doc.setFontSize(20).text('Tornado.cash', padding, 40)
      doc.setFontStyle('normal').text(this.$t('complianceReport', 'en'), 65, 40)

      doc.setFontSize(8).text(this.$t('verified', 'en'), padding, 81)
      doc.text(this.$t('verified', 'en'), startSecondColumnX, 81)
      doc.text(fee, endX, 81, null, null, 'right')

      doc.setFontSize(14).text(this.$t('deposit', 'en'), padding, 75)
      doc.text(this.$t('withdrawal', 'en'), startSecondColumnX, 75)
      doc.text(this.$t('warning', 'en'), padding, 200)
      doc.setFontStyle('bold').text(depositAmount, endFirstColumnX, 75, null, null, 'right')
      doc.text(withdrawalAmount, endX, 75, null, null, 'right')

      const logo = require('@/assets/img/tornado_black.png')
      const imgLogo = new Image()
      imgLogo.src = logo
      doc.addImage(imgLogo, 'PNG', padding, padding, 42.8625, 11.1125)

      const markSize = 23.8125
      const mark = require('@/assets/img/tornado_mark.png')
      const imgMark = new Image()
      imgMark.src = mark
      doc.addImage(imgMark, 'PNG', endX - markSize, 160, markSize, markSize)

      doc.save(`tornadocash-compliance-${this.txDepositInfo.currency}-${this.txDepositInfo.amount}.pdf`)
    },
    resetState() {
      this.loaded = false
      this.error = { type: '', msg: '' }
      this.txDepositInfo = {
        amount: null,
        currency: '',
        isSpent: false,
        timestamp: null,
        txHash: '',
        from: ''
      }
      this.txWithdrawalInfo = {
        amount: null,
        txHash: '',
        timestamp: null,
        to: '',
        nullifier: '',
        fee: null
      }
    },
    onCopy() {
      this.$store.dispatch('notice/addNoticeWithInterval', {
        notice: {
          title: 'copied',
          type: 'info'
        },
        interval: 3000
      })
    },
    hashRender: (hash) => hashRender(hash, 20, '..')
  }
}
</script>
