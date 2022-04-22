<template>
  <div class="field field-slider">
    <div class="label">
      Gas Price
      <b-field :class="hasError ? 'is-warning' : ''">
        <b-input
          ref="gasPriceInput"
          v-model.number="input"
          type="number"
          :min="0"
          custom-class="hide-spinner"
          :use-html5-validation="false"
          expanded
          :style="{ width: reactiveWidth }"
        ></b-input>
        <div class="control has-text" @click="$refs.gasPriceInput.focus()">
          <span>Gwei</span>
        </div>
      </b-field>
    </div>
    <b-slider
      v-model="slider"
      :min="0"
      :max="2"
      :custom-formatter="tooltipFormat"
      bigger-slider-focus
      lazy
      rounded
      @change="onChange"
    >
      <template v-for="(val, index) of Object.keys(gasPrices).filter((k) => k !== 'instant')">
        <b-slider-tick :key="val" :value="index">{{ $t(`gasPriceSlider.${val}`) }}</b-slider-tick>
      </template>
    </b-slider>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { debounce } from '@/utils'
const { toWei, toHex } = require('web3-utils')

export default {
  inheritAttrs: false,
  data() {
    return {
      input: null,
      slider: 2,
      hasError: false,
      reactiveWidth: ''
    }
  },
  computed: {
    ...mapGetters('gasPrices', ['gasPrices'])
  },
  watch: {
    input: {
      handler(gasPrice) {
        this.setWidth(gasPrice)
        debounce(this.validateGasPrice, gasPrice)
      }
    }
  },
  mounted() {
    this.input = this.gasPrices.fast
    this.setWidth(this.input)
  },
  methods: {
    onChange(index) {
      this.input = this.getValueFromIndex(index)
    },
    tooltipFormat(index) {
      return this.getValueFromIndex(index)
    },
    getValueFromIndex(index) {
      switch (Number(index)) {
        case 2:
          return this.gasPrices.fast
        case 1:
          return this.gasPrices.standard
        case 0:
          return this.gasPrices.low
      }
    },
    validateGasPrice(gasPrice) {
      try {
        let speed = ''
        this.hasError = false

        if (gasPrice === '') {
          throw new Error('must not be an empty')
        }
        if (gasPrice <= 0) {
          throw new Error('must be greater than zero')
        }

        if (gasPrice < this.gasPrices.standard) {
          speed = 'low'
          this.slider = 0
        } else if (gasPrice === this.gasPrices.standard) {
          this.slider = 1
          speed = 'standard'
        } else {
          this.slider = 2
          speed = 'fast'
        }

        if (gasPrice) {
          gasPrice = {
            speed,
            value: toHex(toWei(gasPrice.toString(), 'gwei'))
          }
        }
        this.$emit('input', gasPrice)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Invalid gas price:', e.message)
        this.hasError = true
      } finally {
        this.$emit('validate', !this.hasError)
      }
    },
    setWidth(value) {
      if (!value) {
        value = 0
      }

      this.reactiveWidth = `${Math.min(75, Math.max(35, 19 + value && value.toString().length * 12))}px`
    }
  }
}
</script>
