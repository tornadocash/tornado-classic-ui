<template>
  <div class="proposals-list">
    <div class="proposals-list--header">
      <div class="title">{{ $t('proposals') }}</div>
      <b-field class="field-tabs">
        <b-radio-button v-model="proposalStatusFilter" native-value="" type="is-primary">
          <span>{{ $t('all') }}</span>
        </b-radio-button>

        <b-radio-button v-model="proposalStatusFilter" native-value="active" type="is-primary">
          <span>{{ $t('active') }}</span>
        </b-radio-button>
      </b-field>
      <b-field class="field-btn">
        <b-tooltip
          :label="
            $t('proposalThresholdError', {
              PROPOSAL_THRESHOLD: $n(proposalThreshold)
            })
          "
          :active="!hasProposalThreshold"
          multilined
        >
          <b-button
            type="is-primary"
            :icon-left="isFetchingBalances ? '' : 'plus'"
            outlined
            :disabled="!hasProposalThreshold"
            :loading="isFetchingBalances"
            @click="onCreateProposal"
          >
            {{ $t('createProposal') }}
          </b-button>
        </b-tooltip>
      </b-field>
    </div>
    <div class="proposals-list--container">
      <ProposalsListSkeleton v-if="isFetchingProposals" />
      <ProposalsListItem v-for="proposal in filteredProposals" v-else :key="proposal.id" :data="proposal" />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import ProposalsListItem from '@/components/governance/ProposalsListItem'
import ProposalsListSkeleton from '@/components/governance/ProposalsListSkeleton'

const { toBN } = require('web3-utils')
export default {
  components: {
    ProposalsListItem,
    ProposalsListSkeleton
  },
  data() {
    return {
      proposalStatusFilter: '',
      timer: null
    }
  },
  computed: {
    ...mapState('governance/gov', ['lockedBalance', 'proposals']),
    ...mapGetters('governance/gov', ['isFetchingProposals', 'constants', 'isFetchingBalances']),
    ...mapGetters('token', ['toDecimals']),
    filteredProposals() {
      return this.proposals
        .filter((proposal) => {
          if (this.proposalStatusFilter) {
            return proposal.status === this.proposalStatusFilter || proposal.status === 'awaitingExecution'
          }
          return true
        })
        .reverse()
    },
    hasProposalThreshold() {
      const PROPOSAL_THRESHOLD = toBN(this.constants.PROPOSAL_THRESHOLD)
      return toBN(this.lockedBalance).gte(PROPOSAL_THRESHOLD)
    },
    proposalThreshold() {
      return this.toDecimals(this.constants.PROPOSAL_THRESHOLD, 18)
    }
  },
  methods: {
    onCreateProposal() {
      this.$emit('onCreateProposal')
    }
  }
}
</script>
