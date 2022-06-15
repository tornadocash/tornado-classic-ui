<template>
  <div class="box box-tx is-waiting" :class="{ 'is-danger': isFailed }">
    <div class="columns is-vcentered">
      <div class="column is-time" :data-label="$t('timePassed')">{{ time }}</div>
      <div class="column is-amount" :data-label="$t('amount')">
        {{ job.amount }}
        {{ currency }}
      </div>
      <div class="column is-deposit" :data-label="$t('subsequentDeposits')">
        <b-skeleton v-if="!isFailed" width="80" />
        <template v-else>-</template>
      </div>
      <div class="column is-hash" :data-label="$t('txHash')">
        <b-skeleton v-if="!job.txHash && job.status !== 'FAILED'" />
        <div v-else class="details">
          <p class="detail">
            <a
              data-test="txhash_text"
              class="detail-description"
              :href="txExplorerUrl(job.txHash)"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ job.txHash }}
            </a>
          </p>
        </div>
      </div>
      <div class="column is-status" :data-label="$t('status')">
        <b-skeleton v-if="!job.status" width="60" />
        <template v-else>
          <div class="status-with-loading">
            {{ status }}
            <b-icon v-show="!isFailed" icon="loading" size="is-small" />
          </div>
        </template>
      </div>
      <div class="column column-buttons">
        <b-button type="is-primary" size="is-small" icon-left="copy" disabled>
          {{ $t('note') }}
        </b-button>
        <b-button
          type="is-dark"
          size="is-small"
          icon-right="remove"
          :disabled="!isFailed"
          @click="onDelete"
        />
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
export default {
  props: {
    job: {
      type: Object,
      required: true,
      timer: null
    }
  },
  data() {
    return {
      time: ''
    }
  },
  computed: {
    ...mapGetters('txHashKeeper', ['txExplorerUrl']),
    ...mapGetters('metamask', ['netId']),
    ...mapGetters('token', ['getSymbol']),
    isFailed() {
      return this.job.status === 'FAILED'
    },
    status() {
      switch (this.job.status) {
        case 'ACCEPTED':
          return this.$t('accepted')
        case 'SENT':
          return this.$t('sent')
        case 'MINED':
          return this.$t('mined')
        case 'CONFIRMED':
          return this.$t('confirmed')
        case 'FAILED':
          return this.$t('failed')
        case 'QUEUED':
          return this.$t('queued')
        default:
          return this.job.status
      }
    },
    currency() {
      return this.getSymbol(this.job.currency)
    }
  },
  mounted() {
    this.update()
  },
  beforeDestroy() {
    clearTimeout(this.timer)
  },
  methods: {
    update() {
      this.updateTime()

      this.timer = setTimeout(() => {
        this.update()
      }, 10000)
    },
    onDelete() {
      this.$store.commit('relayer/DELETE_JOB', { id: this.job.id, type: 'tornado', netId: this.netId })
    },
    updateTime(t = this.job.timestamp) {
      this.time = this.$moment.unix(t).fromNow()
    }
  }
}
</script>
