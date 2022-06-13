<template>
  <div class="governance-head">
    <div class="columns is-mobile is-multiline is-centered is-vcentered">
      <div class="column is-12-mobile is-6-tablet is-3-desktop">
        <div class="info-name">{{ $t('availableBalance') }}</div>
        <div class="info-value"><number-format :value="balance" /> TORN</div>
      </div>
      <div class="column is-12-mobile is-6-tablet is-3-desktop">
        <div class="info-name">{{ $t('stakingReward.title') }}</div>
        <div class="info-value"><number-format :value="reward" /> TORN</div>
      </div>
      <div class="column is-12-mobile is-6-tablet is-3-desktop">
        <div class="info-name">{{ $t('votingPower') }}</div>
        <div class="info-value has-tooltip">
          <span><number-format :value="votingPower" /> TORN</span>
          <b-tooltip
            :label="
              `${$n(toDecimals(lockedBalance, 18))} ${$t('locked')} TORN + ${$n(
                toDecimals(delegatedBalance, 18)
              )} ${$t('delegated')} TORN`
            "
            size="is-medium"
            position="is-top"
            multilined
          >
            <button class="button is-primary has-icon">
              <span class="icon icon-info"></span>
            </button>
          </b-tooltip>
        </div>
      </div>
      <div class="column is-12-mobile is-6-tablet is-3-desktop">
        <div class="info-value without-label has-text-right-desktop">
          <b-button
            type="is-text"
            :icon-left="isDataLoading ? '' : 'settings'"
            :loading="isDataLoading"
            data-test="button_manage_torn"
            @click.native="onManage"
          >
            {{ $t('manage') }}
          </b-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import ManageBox from './manage/ManageBox'
import NumberFormat from '@/components/NumberFormat'
const { fromWei } = require('web3-utils')

export default {
  components: {
    NumberFormat
  },
  computed: {
    ...mapState('torn', {
      balance: (state) => fromWei(state.balance)
    }),
    ...mapState('governance/gov', ['lockedBalance', 'delegatedBalance']),
    ...mapGetters('governance/gov', ['isFetchingBalances', 'isEnabledGovernance']),
    ...mapGetters('governance/staking', ['reward', 'isCheckingReward']),
    ...mapGetters('token', ['toDecimals']),
    ...mapState('metamask', ['isInitialized']),
    votingPower() {
      return fromWei(this.$store.getters['governance/gov/votingPower'])
    },
    isDataLoading() {
      return this.isCheckingReward || this.isFetchingBalances
    }
  },
  watch: {
    isInitialized: {
      handler(isInitialized) {
        if (isInitialized && this.isEnabledGovernance) {
          this.checkReward()
          this.fetchTokenBalance()
          this.fetchTokenAllowance()
          this.REMOVE_SIGNATURE()
          this.fetchUserData()
          this.fetchDelegatedBalance()
        }
      },
      immediate: true
    }
  },
  methods: {
    ...mapActions('governance/staking', ['checkReward']),
    ...mapActions('torn', ['fetchTokenBalance', 'fetchTokenAllowance']),
    ...mapActions('governance/gov', ['fetchUserData', 'fetchDelegatedBalance']),
    ...mapMutations('torn', ['REMOVE_SIGNATURE']),
    onManage() {
      const manageBox = this.$buefy.modal.open({
        parent: this,
        component: ManageBox,
        hasModalCard: true,
        width: 480,
        customClass: 'is-pinned is-manage-box'
      })
      manageBox.$on('close', () => {
        this.isManageBoxOpened = false
      })
    }
  }
}
</script>
