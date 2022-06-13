<template>
  <b-tab-item :label="$t('lock')" header-class="lock_torn_tab">
    <div class="p">
      {{ $t('lockTabDesc') }}
    </div>
    <b-field :label="$t('amountToLock')" expanded>
      <b-field :class="hasErrorAmount ? 'is-warning' : ''">
        <b-input
          v-model="computedAmountToLock"
          data-test="input_torn_amount_to_lock"
          step="0.01"
          :min="minAmount"
          :max="maxAmountToLock"
          custom-class="hide-spinner"
          :use-html5-validation="false"
          :placeholder="$t('amount')"
          expanded
        ></b-input>
        <div class="control has-button">
          <button
            class="button is-primary is-small is-outlined"
            data-test="button_max_torn_amount_to_lock"
            @mousedown.prevent
            @click="setMaxAmountToLock"
          >
            {{ $t('max') }}
          </button>
        </div>
      </b-field>
    </b-field>
    <div class="label-with-value">
      {{ $t('availableBalance') }}:
      <span><number-format data-test="info_available_balance" :value="maxAmountToLock" /> TORN</span>
    </div>
    <div class="buttons buttons__halfwidth">
      <b-button
        type="is-primary is-fullwidth"
        outlined
        data-test="button_approve_torn"
        :disabled="disabledApprove"
        @click="onApprove"
      >
        {{ $t('approve') }}
      </b-button>
      <b-button
        type="is-primary is-fullwidth"
        outlined
        data-test="button_lock_torn"
        :disabled="disabledLock"
        @click="onLock"
      >
        {{ $t('lock') }}
      </b-button>
    </div>
  </b-tab-item>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import { toWei, fromWei } from 'web3-utils'
import { BigNumber as BN } from 'bignumber.js'

import { debounce } from '@/utils'
import NumberFormat from '@/components/NumberFormat'

export default {
  components: {
    NumberFormat
  },
  data() {
    return {
      amountToLock: '',
      minAmount: '0',
      hasErrorAmount: false
    }
  },
  inject: ['close', 'formatNumber'],
  computed: {
    ...mapState('torn', ['signature', 'balance', 'allowance']),
    maxAmountToLock() {
      return fromWei(this.balance)
    },
    hasEnoughApproval() {
      if (Number(this.amountToLock) && new BN(this.allowance).gte(new BN(toWei(this.amountToLock)))) {
        return true
      }

      return Boolean(this.signature.v) && this.signature.amount === this.amountToLock
    },
    disabledApprove() {
      if (!Number(this.amountToLock) || this.signature.amount === this.amountToLock) {
        return true
      }

      const allowance = new BN(String(this.allowance))
      const amount = new BN(toWei(this.amountToLock))

      if (allowance.isZero()) {
        return false
      }

      return allowance.gte(amount)
    },
    disabledLock() {
      return Number(this.amountToLock) && !this.hasEnoughApproval
    },
    computedAmountToLock: {
      get() {
        return this.amountToLock
      },
      set(value) {
        this.amountToLock = this.formatNumber(value)

        debounce(this.validateLock, this.amountToLock)
      }
    }
  },
  methods: {
    ...mapActions('torn', ['signApprove']),
    ...mapActions('governance/gov', ['lock', 'lockWithApproval']),
    async onApprove() {
      this.$store.dispatch('loading/enable', { message: this.$t('preparingTransactionData') })
      await this.signApprove({ amount: this.amountToLock })
      this.$store.dispatch('loading/disable')
    },
    async onLock() {
      this.$store.dispatch('loading/enable', { message: this.$t('preparingTransactionData') })
      if (this.signature.v) {
        await this.lock()
      } else {
        await this.lockWithApproval({ amount: this.amountToLock })
      }
      this.$store.dispatch('loading/disable')
      this.close()
    },
    setMaxAmountToLock() {
      this.computedAmountToLock = this.maxAmountToLock
    },
    validateLock(value) {
      this.amountToLock = this.validateAmount(value, this.maxAmountToLock)
    },
    validateAmount(value, maxAmount) {
      this.hasErrorAmount = false

      let amount = new BN(value)

      if (amount.isZero()) {
        amount = this.minAmount
        this.hasErrorAmount = true
      } else if (amount.lt(this.minAmount)) {
        amount = this.minAmount
        this.hasErrorAmount = true
      } else if (amount.gt(maxAmount)) {
        amount = maxAmount
        this.hasErrorAmount = true
      }

      return amount.toString(10)
    }
  }
}
</script>
