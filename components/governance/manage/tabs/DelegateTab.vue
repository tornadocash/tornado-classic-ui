<template>
  <b-tab-item :label="$t('delegate')" header-class="delegate_tab">
    <div class="p">
      {{ $t('delegateTabDesc') }}
    </div>
    <b-field :label="$t('recipient')">
      <b-input
        v-model="delegatee"
        :placeholder="$t('address')"
        :size="!delegatee ? '' : isValidAddress ? 'is-primary' : 'is-warning'"
      ></b-input>
    </b-field>
    <div class="label-with-value">
      {{ $t('currentDelegate') }}:
      <a target="_blank" :href="addressExplorerUrl(currentDelegate)" rel="noopener noreferrer">{{
        delegateMsg
      }}</a>
    </div>
    <div>
      <b-tooltip
        class="is-block"
        :label="`${$t('pleaseLockBalance')}`"
        position="is-top"
        :active="!canDelegate"
        multilined
      >
        <b-button
          :disabled="!canDelegate || !isValidAddress"
          type="is-primary is-fullwidth"
          outlined
          @click="onDelegate"
        >
          {{ $t('delegate') }}
        </b-button>
      </b-tooltip>
    </div>
  </b-tab-item>
</template>

<script>
import { isAddress } from 'web3-utils'
import { BigNumber as BN } from 'bignumber.js'
import { mapActions, mapState, mapGetters } from 'vuex'

export default {
  data() {
    return {
      delegatee: ''
    }
  },
  inject: ['close'],
  computed: {
    ...mapState('torn', ['signature', 'balance', 'allowance']),
    ...mapState('governance/gov', ['lockedBalance', 'timestamp', 'currentDelegate']),
    ...mapGetters('token', ['toDecimals']),
    ...mapGetters('txHashKeeper', ['addressExplorerUrl']),
    isValidAddress() {
      return isAddress(this.delegatee)
    },
    canDelegate() {
      return new BN(this.lockedBalance).gt(new BN('0'))
    },
    canUndelegate() {
      return this.currentDelegate !== '0x0000000000000000000000000000000000000000'
    },
    delegateMsg() {
      if (!this.canUndelegate) {
        return this.$t('none')
      } else {
        return this.currentDelegate
      }
    }
  },
  methods: {
    ...mapActions('governance/gov', ['delegate']),
    async onDelegate() {
      this.$store.dispatch('loading/enable', { message: this.$t('preparingTransactionData') })
      await this.delegate({ delegatee: this.delegatee })
      this.$store.dispatch('loading/disable')
      this.close()
    }
  }
}
</script>
