<template>
  <b-tooltip position="is-bottom" type="is-dark-tooltip" :triggers="[]">
    <template v-slot:content>
      <template v-if="isSetupAccount">
        <p>{{ $t('accountConnected') }}</p>
        <a @click="onCopy">{{ shortAddress(accounts.encrypt) }}</a>
        <p><NumberFormat :value="noteAccountBalance" /> {{ currency }}</p>
      </template>
      <template v-else>
        <p>{{ $t('notConnected') }}</p>
        <b-button type="is-primary-link mb-0" @click="redirectToAccount">{{ $t('connectAccount') }}</b-button>
      </template>
    </template>
    <b-button type="is-nav-icon" icon-left="wallet" :class="{ tornado: isSetupAccount }"></b-button>
  </b-tooltip>
</template>

<script>
import { indicatorComputed, indicatorMethods } from '../../injectors'
import { NumberFormat } from '../../dependencies'
import { sliceAddress } from '@/utils'

export default {
  components: {
    NumberFormat
  },
  props: {
    active: {
      type: Boolean
    }
  },
  computed: {
    ...indicatorComputed
  },
  methods: {
    ...indicatorMethods,
    shortAddress(address) {
      return sliceAddress(address)
    },
    async onCopy() {
      await this.$copyText(this.accounts.encrypt)
      this.$store.dispatch('notice/addNoticeWithInterval', {
        notice: {
          title: 'copied',
          type: 'info'
        },
        interval: 2000
      })
    }
  }
}
</script>
