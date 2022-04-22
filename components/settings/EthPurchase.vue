<template>
  <b-field :type="type" :message="error">
    <template slot="label">
      {{ $t('ethPurchase', { currency }) }}
      <b-tooltip
        :label="$t('ethPurchaseTooltip', { currency: selectedStatisticCurrency, networkCurrency: currency })"
        size="is-small"
        position="is-right"
        multilined
      >
        <button class="button is-primary has-icon">
          <span class="icon icon-info"></span>
        </button>
      </b-tooltip>
    </template>
    <div
      class="field has-eth-purchase"
      :class="[type, { 'is-disabled': disabled }]"
      @click="onEthPurchaseClick"
    >
      <div class="columns is-mobile">
        <div class="column currency-container is-light">
          <div class="currency">{{ currency }}</div>
          <b-input
            ref="input"
            v-model.number="newValue"
            type="number"
            step="0.01"
            :max="max"
            :min="min"
            :disabled="disabled"
            :use-html5-validation="false"
            expanded
            custom-class="hide-spinner"
            @input="onInput"
            @focus="$emit('focus', $event)"
            @blur="$emit('blur', $event)"
          />
          <div class="withdraw-data">
            <div class="withdraw-data-item">
              {{ $t('rate') }}
              <span> {{ toDecimals(tokenRate, 18, 6) }} {{ currency }}/{{ selectedStatisticCurrency }} </span>
            </div>
          </div>
        </div>
        <div class="column arrow-container">
          <EthPurchaseArrow />
        </div>
        <div class="column currency-container is-inverted">
          <div class="currency">{{ selectedStatisticCurrency }}</div>
          <div class="input">{{ ethToReceiveInToken }}</div>
        </div>
      </div>
    </div>
  </b-field>
</template>
<script>
import { mapState, mapGetters } from 'vuex'
import { EthPurchaseArrow } from '@/components/icons'
import { debounce } from '@/utils'
const { toBN, toWei } = require('web3-utils')

export default {
  components: {
    EthPurchaseArrow
  },
  props: {
    disabled: Boolean,
    value: {
      type: Number,
      required: true
    },
    defaultEthToReceive: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      type: '',
      min: 0,
      error: '',
      newValue: this.value
    }
  },
  computed: {
    ...mapState('application', ['selectedStatistic']),
    ...mapGetters('application', ['maxEthToReceive', 'selectedStatisticCurrency']),
    ...mapGetters('token', ['toDecimals']),
    ...mapGetters('metamask', ['networkConfig', 'currency']),
    ...mapGetters('price', ['tokenRate']),
    max() {
      return Math.max(0, Number(this.toDecimals(this.maxEthToReceive, 18, 5)))
    },
    ethToReceiveInToken() {
      const { currency } = this.selectedStatistic
      const { decimals } = this.networkConfig.tokens[currency]
      const price = this.tokenRate

      const ethToReceive = toBN(toWei(Math.min(Math.max(this.min, this.newValue), this.max).toString()))
      return this.toDecimals(ethToReceive.mul(toBN(10 ** decimals)).div(toBN(price)), null, 6)
    }
  },
  watch: {
    value(value) {
      this.newValue = value
    },
    newValue(value) {
      debounce(this.validateEthToReceive, value)
    }
  },
  mounted() {
    this.validateEthToReceive(this.newValue)
  },
  methods: {
    onEthPurchaseClick() {
      this.$refs.input.focus()
    },
    onInput(value) {
      const parsedValue = parseFloat(value)
      if (!Number.isNaN(parsedValue)) {
        this.$emit('input', parsedValue)
      }
    },
    validateEthToReceive(value) {
      let type = ''
      let error = ''

      if (value === '') {
        type = 'is-warning'
        error = this.$t('incorrectAmount')
      } else if (value < 0) {
        type = 'is-warning'
        error = this.$t('amountIsLow', { value: this.min })
      } else if (value > this.max) {
        type = 'is-warning'
        error = this.$t('amountIsHigh', { value: this.max })
      } else if (value === this.defaultEthToReceive) {
        type = 'is-primary'
      }

      this.error = error
      this.type = type
      this.$emit('isValidEthToReceive', type !== 'is-warning')
    }
  }
}
</script>
