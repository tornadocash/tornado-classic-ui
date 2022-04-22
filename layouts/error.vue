<template>
  <div class="has-text-centered">
    <Error404Icon />
    <h1 class="title is-1">{{ $t('errorPage.title') }}</h1>
    <p class="p mb-6">{{ $t('errorPage.description') }}</p>
    <b-button type="is-primary" icon-left="logo" outlined @click="handleRedirect">{{
      $t('errorPage.button')
    }}</b-button>
  </div>
</template>
<script>
import { Error404Icon } from '@/components/icons'

export default {
  name: 'ErrorPage',
  components: {
    Error404Icon
  },
  data() {
    return {}
  },
  computed: {},
  mounted() {},
  methods: {
    handleRedirect() {
      this.$router.push('/')
    }
  },
  head() {
    return {
      bodyAttrs: {
        class: 'is-centered-main-content'
      }
    }
  }
}
</script>
