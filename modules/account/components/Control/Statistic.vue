<template>
  <div class="action-item">
    <b-icon icon="account-balance" size="is-large" />
    <i18n path="account.control.balance" tag="div" class="desc">
      <template v-if="hasBalances" v-slot:value>
        <p class="balance">
          <span v-for="(item, index) in getBalance" :key="item.currency" class="balance-item"
            ><NumberFormat :value="item.amount" /> {{ getSymbol(item.currency)
            }}{{ index !== getBalance.length - 1 ? ',' : '' }}</span
          >
        </p>
      </template>
    </i18n>
  </div>
</template>

<script>
import { statisticComputed } from '../../injectors'
import { NumberFormat } from '../../dependencies'

export default {
  components: {
    NumberFormat
  },
  computed: {
    ...statisticComputed,
    getBalance() {
      const balances = this.statistic.reduce((acc, { currency, amount }) => {
        if (acc[currency]) {
          acc[currency] += Number(amount)
        } else {
          acc[currency] = Number(amount)
        }
        return acc
      }, {})
      return Object.keys(balances).map((k) => {
        return {
          currency: k,
          amount: balances[k]
        }
      })
    },
    hasBalances() {
      return this.getBalance && this.getBalance.length
    }
  }
}
</script>
