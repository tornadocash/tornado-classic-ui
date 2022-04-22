<template>
  <ProposalsList @onCreateProposal="onCreateProposal" />
</template>

<script>
/* eslint-disable no-console */
import ProposalsList from '@/components/governance/ProposalsList'

export default {
  components: {
    ProposalsList
  },
  methods: {
    onCreateProposal() {
      this.$router.push({ path: '/governance/create' })
    }
  }
}
</script>
