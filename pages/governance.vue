<template>
  <div class="main">
    <Metrics />
    <nuxt-child />
  </div>
</template>

<script>
import { mapActions, mapState, mapGetters } from 'vuex'
import Metrics from '@/components/governance/Metrics'

export default {
  middleware({ store, error }) {
    if (!store.getters['governance/gov/isEnabledGovernance']) {
      return error({ statusCode: 404 })
    }
  },
  components: {
    Metrics
  },
  computed: {
    ...mapState('metamask', ['isInitialized']),
    ...mapGetters('governance/gov', ['isEnabledGovernance'])
  },
  watch: {
    isInitialized: {
      handler() {
        this.fetchProposals({})
        this.fetchConstants()
      },
      immediate: true
    },
    isEnabledGovernance(isEnabled) {
      if (!isEnabled) {
        this.$router.push('/')
      }
    }
  },
  methods: {
    ...mapActions('governance/gov', ['fetchProposals', 'fetchConstants'])
  }
}
</script>
