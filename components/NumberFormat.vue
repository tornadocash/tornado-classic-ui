<template>
  <span class="is-uppercase">{{ num }}</span>
</template>

<script>
import { ROUNDING_PRECISION } from '@/constants'

export default {
  props: {
    value: {
      type: [Number, String],
      default: 0
    },
    format: {
      type: Object,
      default: () => {
        return {
          average: true,
          mantissa: 5,
          trimMantissa: true,
          totalLength: 5,
          lowPrecision: false
        }
      }
    }
  },
  data() {
    return {
      num: 0
    }
  },
  watch: {
    '$i18n.locale'(lang, oldLang) {
      if (lang !== oldLang) {
        this.render()
      }
    },
    value(value, oldvalue) {
      if (value !== oldvalue) {
        this.render()
      }
    }
  },
  mounted() {
    this.render()
  },
  methods: {
    render() {
      if (Number(this.value) <= Number(ROUNDING_PRECISION) && Number(this.value) > 0) {
        this.num = '~0.0001'
        return
      }
      this.num = this.$numbro(this.value).format(this.format)
    }
  }
}
</script>
