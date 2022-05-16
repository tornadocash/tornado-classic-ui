<template>
  <div class="modal-card box box-modal">
    <header class="box-modal-header is-spaced">
      <div class="box-modal-title">{{ $parent.$t('account.modals.decryptInfo.title') }}</div>
      <button type="button" class="delete" @click="$emit('close')" />
    </header>
    <div class="note">{{ $parent.$t('account.modals.decryptInfo.description') }}</div>
    <div class="account-decrypt-info">
      <div class="item">
        {{ $parent.$t('account.modals.decryptInfo.spent') }}
        <span class="has-text-weight-bold mr-3">{{ spent }}</span>
      </div>
      <div class="item">
        {{ $parent.$t('account.modals.decryptInfo.unSpent') }}
        <span class="has-text-weight-bold mr-3">{{ unSpent }}</span>
      </div>
      <template v-for="(instances, currency) in getStatistic">
        <div v-for="(amount, instance) in instances" :key="`${amount}_${currency}_${instance}`" class="item">
          {{ instance }} {{ getSymbol(currency) }}:
          <span class="has-text-weight-bold mr-3">{{ amount }}</span>
        </div>
      </template>
    </div>
    <div class="buttons buttons__halfwidth mt-3">
      <b-button type="is-primary" outlined data-test="button_close_your_note_popup" @click="onClose">
        {{ $parent.$t('account.modals.decryptInfo.close') }}
      </b-button>
      <b-button type="is-primary" data-test="button_main_page_your_notes_popup" @click="handleRedirect">
        {{ $parent.$t('account.modals.decryptInfo.redirect') }}
      </b-button>
    </div>
  </div>
</template>

<script>
import { statisticComputed } from '../injectors'

export default {
  props: {
    all: {
      type: Number,
      required: true
    },
    spent: {
      type: Number,
      required: true
    },
    unSpent: {
      type: Number,
      required: true
    }
  },
  data() {
    return {}
  },
  computed: {
    ...statisticComputed,
    getStatistic() {
      const balance = this.statistic.reduce((acc, { currency, amount }) => {
        if (acc[currency] && acc[currency][amount]) {
          acc[currency][amount] += 1
        } else {
          acc[currency] = {
            ...acc[currency],
            [amount]: 1
          }
        }
        return acc
      }, {})

      return balance
    }
  },
  methods: {
    onClose() {
      this.$emit('close')
    },
    handleRedirect() {
      this.$router.push('/')
      this.$emit('close')
    }
  }
}
</script>
