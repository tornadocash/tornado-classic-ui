<template>
  <i v-if="code" class="flag-icon" :class="flagIconClass"></i>
</template>

<script>
export default {
  name: 'FlagIcon',
  props: {
    code: { type: String, default: null }
  },
  computed: {
    flagIconClass() {
      let code = this.code
      switch (code) {
        case 'zh':
          code = 'cn'
          break
        case 'en':
          code = 'gb'
          break
      }
      return 'flag-icon-' + code
    }
  }
}
</script>
