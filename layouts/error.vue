<template>
  <div class="has-text-centered">
    <ErrorIcon :is404="statusCode === 404" />
    <h1 class="title is-1">{{ $t('errorPage.title') }}</h1>
    <template v-if="statusCode === 204">
      <p class="p mb-6">
        {{
          $t('errorPage.switchNetwork.description', {
            pageName: $t(`errorPage.switchNetwork.pageName.${error.pageName}`)
          })
        }}
      </p>
      <b-button type="is-primary" icon-left="logo" outlined @click="handleSwitchNetwork">{{
        $t('errorPage.switchNetwork.button')
      }}</b-button>
    </template>
    <template v-else>
      <p class="p mb-6">{{ $t('errorPage.description') }}</p>
      <b-button type="is-primary" icon-left="logo" outlined @click="handleRedirect">{{
        $t('errorPage.button')
      }}</b-button>
    </template>
  </div>
</template>
<script>
import { mapActions } from 'vuex'

import { sleep } from '@/utils'
import { ErrorIcon } from '@/components/icons'

export default {
  name: 'ErrorPage',
  components: {
    ErrorIcon
  },
  props: {
    error: {
      type: Object,
      default: null
    }
  },
  computed: {
    statusCode() {
      return this.error?.statusCode || 404
    }
  },
  methods: {
    ...mapActions('metamask', ['networkChangeHandler']),
    ...mapActions('loading', ['enable', 'disable']),
    handleRedirect() {
      this.$router.push('/')
    },
    async handleSwitchNetwork() {
      this.enable({ message: this.$t('changingNetwork') })

      await sleep(800)

      try {
        const providerName = window.localStorage.getItem('provider')

        await this.networkChangeHandler({ netId: 1 })

        if (!providerName) {
          this.$router.go()
        }
      } catch (err) {
        console.log(`handleSwitchNetwork has error ${err.message}`)
      } finally {
        this.disable()
      }
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

<style scoped>
.p {
  max-width: 560px;
  margin: 0 auto;
}
</style>
