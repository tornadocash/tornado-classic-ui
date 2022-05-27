<template>
  <div>
    <b-button type="is-back" icon-left="arrow-left" @click="onBack">
      {{ $t('back') }}
    </b-button>
    <ProposalSkeleton v-if="isFetchingProposals" />
    <Proposal v-else-if="proposal" :data="proposal" />
    <div v-else>{{ $t('proposalDoesNotExist') }}</div>
  </div>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import Proposal from '@/components/governance/Proposal'
import ProposalSkeleton from '@/components/governance/ProposalSkeleton'

export default {
  components: {
    Proposal,
    ProposalSkeleton
  },
  computed: {
    ...mapState('governance/gov', ['proposals']),
    ...mapGetters('governance/gov', ['isFetchingProposals', 'isEnabledGovernance']),
    ...mapState('metamask', ['isInitialized']),
    proposal() {
      return this.proposals[this.$route.params.id - 1]
    }
  },
  watch: {
    isInitialized: {
      handler(isInitialized) {
        if (isInitialized && this.isEnabledGovernance) {
          this.fetchBalances()
          this.fetchedLockedTimestamp()
          this.fetchDelegatee()
          this.fetchLatestProposalId()
        }
      },
      immediate: true
    }
  },
  methods: {
    ...mapActions('governance/gov', [
      'fetchBalances',
      'fetchedLockedTimestamp',
      'fetchDelegatee',
      'fetchLatestProposalId'
    ]),
    onBack() {
      this.$router.push({ path: '/governance' })
    }
  }
}
</script>
