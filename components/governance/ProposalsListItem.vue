<template>
  <div class="proposals-box is-link" @click="onClick">
    <div class="columns is-gapless">
      <div class="column is-8-tablet is-9-desktop">
        <div class="proposals-box--title">
          {{ data.title }}
        </div>
        <div class="proposals-box--info">
          <div class="proposals-box--id">
            <span class="tag">{{ data.id }}</span>
          </div>
          <b-tag :type="getStatusType(data.status)">
            {{ $t(data.status) }}
          </b-tag>
          <div class="date">
            <span>{{ $t('startDate') }}:</span> {{ this.$moment.unix(data.startTime).format('l') }}
          </div>
          <div class="date">
            <span>{{ $t('endDate') }}:</span> {{ this.$moment.unix(data.endTime).format('l') }}
          </div>
          <div class="date">
            <span>{{ $t('quorum') }}:</span> {{ quorumPercent }}%
          </div>
        </div>
      </div>
      <div class="column is-4-tablet is-3-desktop">
        <div class="results">
          <div class="result">
            <span class="has-text-primary"><b-icon icon="check" /> {{ $t('for') }}</span>
            <span><number-format :value="data.results.for" /> TORN</span>
          </div>
          <div class="result is-danger">
            <span class="has-text-danger"><b-icon icon="close" /> {{ $t('against') }}</span>
            <span><number-format :value="data.results.against" /> TORN</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import quorum from './mixins/quorum'
import NumberFormat from '@/components/NumberFormat'

export default {
  components: {
    NumberFormat
  },
  mixins: [quorum],
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  methods: {
    getStatusType(status) {
      let statusType = ''
      switch (status) {
        case 'awaitingExecution':
        case 'active':
          statusType = 'is-primary'
          break
        case 'expired':
          statusType = 'is-gray'
          break
        case 'failed':
        case 'defeated':
          statusType = 'is-danger'
          break
        case 'pending':
        case 'timeLocked':
          statusType = 'is-warning'
          break
        case 'executed':
          statusType = 'is-violet'
          break
      }
      return statusType
    },
    onClick() {
      if (this.data.status !== 'loading') {
        this.$router.push({ path: `/governance/${this.data.id}` })
      }
    }
  }
}
</script>
