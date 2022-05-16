<template>
  <b-tab-item :label="$t('deposit')" header-class="button_tab_deposit">
    <fieldset>
      <b-field :label="$t('token')" data-test="token_list_dropdown">
        <b-dropdown v-model="selectedToken" expanded aria-role="list">
          <div slot="trigger" class="control">
            <div class="input">
              <span>{{ selectedCurrency }}</span>
            </div>
          </div>
          <b-dropdown-item
            v-for="(token, key) in tokens"
            :key="key"
            aria-role="listitem"
            :value="key"
            :data-test="token.dataTest"
          >
            {{ token.symbol }}
          </b-dropdown-item>
        </b-dropdown>
      </b-field>
      <b-field>
        <template slot="label">
          {{ $t('amount') }}
          <b-tooltip :label="$t('amountTooltip')" size="is-small" position="is-right" multilined>
            <button class="button is-primary has-icon">
              <span class="icon icon-info" data-test="choose_amount_info"></span>
            </button>
          </b-tooltip>
        </template>
        <b-steps
          v-model="currentStep"
          size="is-small"
          :has-navigation="false"
          :mobile-mode="null"
          @input="changeAmount"
        >
          <template v-for="({ amount, address }, key) in amounts">
            <b-step-item
              :key="key"
              :label="shortenAmount(amount)"
              :clickable="address !== ''"
              :header-class="`token-${selectedToken}-${amount}`"
            ></b-step-item>
          </template>
        </b-steps>
      </b-field>
    </fieldset>
    <connect-button v-if="!isLoggedIn" type="is-primary is-fullwidth" data-test="button_connect" />
    <b-button
      v-else
      type="is-primary is-fullwidth"
      :loading="isDepositBtnClicked"
      data-test="button_deposit"
      @click="onDeposit"
    >
      {{ $t('depositButton') }}
    </b-button>
  </b-tab-item>
</template>
<script>
/* eslint-disable no-console */
import { mapGetters } from 'vuex'

import ApproveModalBox from '@/components/ApproveModalBox'
import BalanceModalBox from '@/components/BalanceModalBox'
import DepositModalBox from '@/components/DepositModalBox'

import { ConnectButton } from '@/components/web3Connect'

export default {
  components: {
    ConnectButton
  },
  data() {
    return {
      currentStep: 0,
      amounts: [],
      isDepositBtnClicked: false,
      isDepositModalOpened: false
    }
  },
  computed: {
    ...mapGetters('token', ['isSufficientAllowance', 'isSufficientBalance']),
    ...mapGetters('metamask', ['networkConfig', 'netId', 'isLoggedIn', 'nativeCurrency']),
    ...mapGetters('application', ['selectedCurrency']),
    selectedAmount: {
      get() {
        return this.$store.state.application.selectedInstance.amount
      },
      set(selectedAmount) {
        const currency = this.selectedToken
        const amount = selectedAmount
        this.$store.commit('application/SET_SELECTED_INSTANCE', { currency, amount })
        this.$store.dispatch('application/setAndUpdateStatistic', { currency, amount })
      }
    },
    tokens() {
      return Object.keys(this.networkConfig.tokens).reduce((acc, curr) => {
        const item = this.networkConfig.tokens[curr]
        acc[curr] = {
          ...item,
          dataTest: `token_list_${item.symbol.toLowerCase()}`
        }
        return acc
      }, {})
    },
    selectedToken: {
      get() {
        return this.$store.state.application.selectedInstance.currency
      },
      set(selectedToken) {
        this.currentStep = 0
        const currency = selectedToken
        const amount = this.sortAmounts(currency)[0].amount
        this.$store.commit('application/SET_SELECTED_INSTANCE', { currency, amount })
        this.$store.dispatch('application/setAndUpdateStatistic', { currency, amount })
      }
    }
  },
  watch: {
    netId: {
      handler(netId) {
        this.sortAmounts()
      }
    }
  },
  beforeMount() {
    this.sortAmounts()
  },
  methods: {
    shortenAmount(n) {
      return `${this.$n(n, 'compact')} ${this.tokens[this.selectedToken].symbol}`
    },
    changeAmount(i) {
      this.selectedAmount = Number(this.amounts[i].amount)
    },
    sortAmounts(currency = this.selectedToken) {
      this.amounts = Object.entries(this.tokens[currency].instanceAddress)
        .sort((a, b) => {
          return a[0] - b[0]
        })
        .map(([amount, address]) => {
          return { amount: Number(amount), address }
        })
      return this.amounts
    },
    openDepositModal() {
      this.$store.dispatch('application/prepareDeposit', {
        prefix: `tornado-${this.selectedToken}-${this.selectedAmount}-${this.netId}`
      })
      const depositModal = this.$buefy.modal.open({
        parent: this,
        component: DepositModalBox,
        hasModalCard: true,
        width: 440,
        customClass: 'is-pinned',
        canCancel: false
      })
      depositModal.$on('close', () => {
        this.isDepositModalOpened = false
      })
    },
    async onDeposit() {
      const onApproval = () => {
        if (this.isSufficientAllowance) {
          if (!this.isDepositModalOpened) {
            this.isDepositModalOpened = true
            this.openDepositModal()
          }
        }
      }
      this.isDepositBtnClicked = true
      await this.$store.dispatch('token/fetchTokenAllowance', {}, { root: true })
      await this.$store.dispatch('token/fetchTokenBalance', {}, { root: true })
      await this.$store.dispatch('metamask/updateAccountBalance')
      if (!this.isSufficientBalance) {
        this.$buefy.modal.open({
          parent: this,
          component: BalanceModalBox,
          hasModalCard: true,
          width: 440
        })
      } else if (this.isSufficientAllowance || this.selectedToken === this.nativeCurrency) {
        this.openDepositModal()
      } else {
        const parent = this
        const approveModal = this.$buefy.modal.open({
          parent,
          component: ApproveModalBox,
          hasModalCard: true,
          width: 440
        })
        approveModal.$on('close', onApproval)
      }
      this.isDepositBtnClicked = false
    }
  }
}
</script>
