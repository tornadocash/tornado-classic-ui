<template>
  <div v-show="Object.keys(allTxs).length > 0 || Object.keys(jobs('tornado')).length > 0" class="txs">
    <div class="tx-filters buttons">
      <div class="tx-filters-title">{{ $t('filterBy') }}</div>
      <b-button
        v-for="(token, key) in tokens"
        :key="key"
        type="is-primary"
        size="is-small"
        :class="{ 'is-hovered': filters.currency === key }"
        outlined
        :disabled="!activeTokensFilters.has(key) && filters.currency !== key"
        @click="setFilter('currency', key)"
      >
        {{ token.symbol }}
      </b-button>
      <div class="break"></div>
      <b-field>
        <p class="control">
          <b-button
            type="is-primary"
            size="is-small"
            :class="{ 'is-hovered': filters.isSpent === true }"
            outlined
            @click="setSpent(true)"
          >
            {{ $t('spent') }}
          </b-button>
        </p>
        <p class="control">
          <b-button
            type="is-primary"
            size="is-small"
            :class="{ 'is-hovered': filters.isSpent === false }"
            outlined
            @click="setSpent(false)"
          >
            {{ $t('unspent') }}
          </b-button>
        </p>
      </b-field>
      <div class="break"></div>
      <b-field>
        <p class="control">
          <b-button
            type="is-primary"
            size="is-small"
            :class="{ 'is-hovered': transactions === 'regular' }"
            outlined
            @click="setTransactionFilter('regular')"
          >
            {{ $t('regular') }}
          </b-button>
        </p>
        <p class="control">
          <b-button
            type="is-primary"
            size="is-small"
            :class="{ 'is-hovered': transactions === 'encrypted' }"
            outlined
            @click="setTransactionFilter('encrypted')"
          >
            {{ $t('encrypted') }}
          </b-button>
        </p>
      </b-field>
    </div>
    <div class="tx-head">
      <div class="columns">
        <div class="column is-time is-sortable" @click="setSort('timestamp')">
          {{ $t('timePassed') }}

          <span
            v-show="currentSort === 'timestamp'"
            class="icon icon-chevron-up"
            :class="{ 'is-desc': !isAsc }"
          />
        </div>
        <div class="column is-amount is-sortable" @click="setSort('amount')">
          {{ $t('amount') }}
          <span
            v-show="currentSort === 'amount'"
            class="icon icon-chevron-up"
            :class="{ 'is-desc': !isAsc }"
          />
        </div>
        <div class="column is-deposit is-sortable" @click="setSort('deposits')">
          {{ $t('subsequentDeposits') }}
          <span
            v-show="currentSort === 'deposits'"
            class="icon icon-chevron-up"
            :class="{ 'is-desc': !isAsc }"
          />
        </div>
        <div class="column is-hash">{{ $t('txHash') }}</div>
        <div class="column is-status">{{ $t('status') }}</div>
        <div class="column column-buttons"></div>
      </div>
    </div>
    <div class="tx-head-mobile field is-grouped">
      <div class="control is-expanded">
        <b-dropdown v-model="mobileSort" expanded aria-role="list">
          <div slot="trigger" class="control">
            <div class="input">
              <span>{{
                mobileSort === 'timestamp'
                  ? $t('timePassed')
                  : mobileSort === 'amount'
                  ? $t('amount')
                  : $t('subsequentDeposits')
              }}</span>
            </div>
          </div>
          <b-dropdown-item value="timestamp" aria-role="listitem">
            {{ $t('timePassed') }}
          </b-dropdown-item>
          <b-dropdown-item value="amount" aria-role="listitem">{{ $t('amount') }}</b-dropdown-item>
          <b-dropdown-item value="deposits" aria-role="listitem">
            {{ $t('subsequentDeposits') }}
          </b-dropdown-item>
        </b-dropdown>
      </div>
      <div class="control">
        <button class="button is-primary" @click="setSort(mobileSort)">
          <span
            v-show="currentSort === mobileSort"
            class="icon icon-arrow-up"
            :class="{ 'is-desc': !isAsc }"
          />
        </button>
      </div>
    </div>
    <Job v-for="job in jobs('tornado')" :key="job.id" :job="job" />
    <template v-for="tx in filteredTxs">
      <EncryptedTx v-if="tx.isEncrypted" :key="tx.txHash" :tx="tx" />
      <Tx v-else :key="tx.txHash" :tx="tx" />
    </template>
    <div v-show="filteredTxs.length === 0 && jobs('tornado').length === 0" class="box box-tx is-white">
      <div class="columns is-vcentered is-centered">
        <div class="column">{{ $t('thereAreNoElements') }}</div>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-console */
import { mapActions, mapGetters, mapState } from 'vuex'
import Tx from '@/components/Tx'
import EncryptedTx from '@/components/EncryptedTx'
import Job from '@/components/Job'
const { toWei, toBN } = require('web3-utils')

export default {
  components: {
    Tx,
    Job,
    EncryptedTx
  },
  data() {
    return {
      filters: {
        currency: '',
        ifAfter24hrs: false,
        isSpent: undefined,
        timer: null
      },
      transactions: 'all',
      currentSort: 'timestamp',
      isAsc: false,
      mobileSort: 'timestamp'
    }
  },
  computed: {
    ...mapGetters('metamask', ['networkConfig', 'nativeCurrency']),
    ...mapGetters('txHashKeeper', ['allTxs', 'txs', 'txExplorerUrl', 'encryptedTxs']),
    ...mapGetters('relayer', ['jobs']),
    ...mapGetters('price', ['getTokenPrice']),
    ...mapState('application', ['statistic']),
    tokens() {
      return this.networkConfig.tokens
    },
    activeTokensFilters() {
      const filters = new Set()
      this.allTxs.forEach((tx) => {
        filters.add(tx.currency)
      })
      return filters
    },
    filteredTxs() {
      if (this.transactions === 'regular') {
        return this.filterTxs(this.txs)
      }
      if (this.transactions === 'encrypted') {
        return this.filterTxs(this.encryptedTxs)
      }
      return this.filterTxs(this.allTxs)
    }
  },
  watch: {
    mobileSort(sort) {
      if (this.currentSort === sort) {
        return
      }
      this.setSort(sort)
    },
    currentSort(sort) {
      this.mobileSort = sort
    }
  },
  mounted() {
    this.timer = setTimeout(() => {
      this.cleanTxs()
      this.cleanEncryptedTxs()
      this.checkPendingTransaction()
      this.checkPendingEncryptedTransaction()
    }, 2500)
  },
  beforeDestroy() {
    clearTimeout(this.timer)
  },
  methods: {
    ...mapActions('txHashKeeper', [
      'cleanTxs',
      'cleanEncryptedTxs',
      'checkPendingTransaction',
      'checkPendingEncryptedTransaction'
    ]),
    setFilter(filter, value) {
      this.filters[filter] = this.filters[filter] === value ? '' : value
    },
    setSort(sort) {
      this.isAsc = sort === this.currentSort ? !this.isAsc : true
      this.currentSort = sort
    },
    filterTxs(txs) {
      return txs
        .filter((tx) => {
          const isMatched = []
          if (this.filters.currency !== '') {
            isMatched.push(this.filters.currency === tx.currency)
          }
          if (this.filters.ifAfter24hrs) {
            isMatched.push(this.$moment().unix() - Number(tx.timestamp) > 86400)
          }
          if (this.filters.isSpent !== undefined) {
            isMatched.push(this.filters.isSpent === Boolean(tx.isSpent))
          }

          return isMatched.every(Boolean)
        })
        .sort((a, b) => {
          if (this.currentSort === 'deposits') {
            const depositsA = this.getDepositsPast(a)
            const depositsB = this.getDepositsPast(b)
            return this.isAsc ? depositsA - depositsB : depositsB - depositsA
          }
          if (this.currentSort === 'amount') {
            return this.isAsc ? this.compareAmounts(a, b) : this.compareAmounts(b, a)
          }
          return this.isAsc
            ? this.compareNumbers(a[this.currentSort], b[this.currentSort])
            : this.compareNumbers(b[this.currentSort], a[this.currentSort])
        })
    },
    compareNumbers(a, b) {
      const a1 = isNaN(Number(a)) ? 0 : Number(a)
      const b1 = isNaN(Number(b)) ? 0 : Number(b)

      return a1 - b1
    },
    compareAmounts(a, b) {
      let amountA = toBN(toWei(a.amount))
      if (a.currency !== this.nativeCurrency) {
        const priceA = toBN(this.getTokenPrice(a.currency))
        amountA = amountA.mul(priceA)
      }

      let amountB = toBN(toWei(b.amount))
      if (b.currency !== this.nativeCurrency) {
        const priceB = toBN(this.getTokenPrice(b.currency))
        amountB = amountB.mul(priceB)
      }

      return amountA.cmp(amountB)
    },
    getDepositsPast(tx) {
      const [, currency, amount] = tx.prefix.split('-')
      return this.statistic[currency][amount].nextDepositIndex - tx.index - 1
    },
    setTransactionFilter(value) {
      this.transactions = this.transactions === value ? 'all' : value
    },
    setSpent(value) {
      this.filters.isSpent = this.filters.isSpent === value ? undefined : value
    }
  }
}
</script>
