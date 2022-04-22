import { mapGetters } from 'vuex'
const { toBN, fromWei, toWei } = require('web3-utils')

export default {
  computed: {
    ...mapGetters('governance/gov', ['quorumVotes']),
    results() {
      const resultFor = toBN(toWei(this.data.results.for))
      const resultAgainst = toBN(toWei(this.data.results.against))
      return resultFor.add(resultAgainst)
    },
    quorumResult() {
      return fromWei(this.results)
    },
    quorumVotesToWei() {
      return toBN(toWei(this.quorumVotes))
    },
    isQuorumCompleted() {
      return this.results.gte(this.quorumVotesToWei)
    },
    quorumPercent() {
      return this.isQuorumCompleted
        ? 100
        : toBN('100')
            .mul(this.results)
            .div(this.quorumVotesToWei)
            .toNumber()
    }
  }
}
