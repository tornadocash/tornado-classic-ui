<template>
  <div>
    <b-notification
      v-if="netId === 56"
      :active="isActiveNotification.binanceInternal"
      class="main-notification"
      type="is-warning"
      icon-pack="icon"
      has-icon
      :aria-close-label="$t('closeNotification')"
      @close="disableNotification({ key: 'binanceInternal' })"
    >
      <i18n path="binanceInternalTxsNotification" />
    </b-notification>

    <b-notification
      :active="isActiveNotification.third"
      class="main-notification"
      type="is-warning"
      icon-pack="icon"
      has-icon
      :aria-close-label="$t('closeNotification')"
      @close="disableNotification({ key: 'third' })"
    >
      <i18n path="trustBanner.trustLess">
        <template v-slot:link>
          <a href="https://tornado.cash/">{{ $t('trustBanner.link') }}</a>
        </template>
      </i18n>
    </b-notification>

    <b-notification
      :active="isActiveNotification.first"
      class="main-notification"
      type="is-info"
      icon-pack="icon"
      has-icon
      :aria-close-label="$t('closeNotification')"
      @close="disableNotification({ key: 'first' })"
    >
      <i18n path="indexNotification">
        <template v-slot:link>
          <a
            href="https://twitter.com/TornadoCash/status/1204745639759884289"
            target="_blank"
            rel="noopener noreferrer"
            >{{ $t('indexNotificationLinkText') }}</a
          >
        </template>
      </i18n>
    </b-notification>
    <div class="columns">
      <div class="column is-half">
        <b-tabs v-model="activeTab" class="is-tornado" :animated="false" @input="tabChanged">
          <Deposit />
          <Withdraw :active-tab="activeTab" @get-key="onGetKey" />
        </b-tabs>
      </div>
      <Statistics />
    </div>
    <Txs />
  </div>
</template>
<script>
/* eslint-disable no-console */
import { mapState, mapGetters, mapActions } from 'vuex'

import Txs from '@/components/Txs'
import Deposit from '@/components/Deposit'
import Statistics from '@/components/Statistics'
import Withdraw from '@/components/withdraw/Withdraw'

export default {
  name: 'HomePage',
  components: {
    Txs,
    Deposit,
    Withdraw,
    Statistics
  },
  data() {
    return {
      activeTab: 0,
      isActive: false
    }
  },
  computed: {
    ...mapState('application', ['selectedInstance']),
    ...mapState('settings', ['isActiveNotification']),
    ...mapGetters('metamask', ['netId'])
  },
  watch: {
    netId() {
      if (this.activeTab === 1) {
        this.$store.dispatch('relayer/pickRandomRelayer', { type: 'tornado' })
      }
    }
  },
  created() {
    this.$store.dispatch('application/setNativeCurrency', { netId: this.netId })
    this.checkIsTrustedUrl()
  },
  methods: {
    ...mapActions('settings', ['disableNotification']),
    checkIsTrustedUrl() {
      const isIpfs = this.$isLoadedFromIPFS()
      if (!isIpfs) {
        this.disableNotification({ key: 'third' })
      }
    },
    onGetKey(fn) {
      this.getKeys = fn
    },
    async tabChanged(tabIndex) {
      if (tabIndex === 1) {
        this.$store.dispatch('relayer/pickRandomRelayer', { type: 'tornado' })

        if (typeof this.getKeys === 'function' && !this.isActive) {
          this.isActive = true
          const result = await this.getKeys()

          if (!result) {
            this.isActive = false
          }
        }
      } else {
        const { currency, amount } = this.selectedInstance
        this.$store.dispatch('application/setAndUpdateStatistic', { currency, amount })
      }
    }
  }
}
</script>
