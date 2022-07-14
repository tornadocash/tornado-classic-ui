<template>
  <div class="proposals-box">
    <div class="columns is-gapless">
      <div class="column proposals-box--tags">
        <div
          class="tag"
          :class="{
            'proposals-box--revote': revote,
            'is-primary': support,
            'is-danger': !support
          }"
        >
          <span><number-format :value="votes" /> TORN</span>
        </div>

        <b-tooltip v-if="delegator" :label="delegator" position="is-top">
          <div class="tag proposals-box--id">{{ $t('delegated') }}</div>
        </b-tooltip>

        <b-tooltip :label="voter" position="is-top">
          <div class="tag proposals-box--id">{{ shortVoter }}</div>
        </b-tooltip>
      </div>
      <div class="column is-narrow proposals-box--date">
        <div class="date">
          <span>{{ $t('date') }}:</span> {{ date }}
        </div>
      </div>
    </div>

    <span v-if="contact" class="proposals-box--title">{{ contact }}</span>
    <div v-if="message" class="proposals-box--info" v-text="message" />
  </div>
</template>

<script>
import { sliceAddress } from '@/utils'
import NumberFormat from '@/components/NumberFormat'

export default {
  components: {
    NumberFormat
  },
  inheritAttrs: false,
  props: {
    contact: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    support: {
      type: Boolean,
      required: true
    },
    timestamp: {
      type: Number,
      required: true
    },
    votes: {
      type: String,
      required: true
    },
    voter: {
      type: String,
      required: true
    },
    revote: {
      type: Boolean,
      required: true
    },
    delegator: {
      type: String,
      default: ''
    }
  },
  data: (vm) => ({
    shortVoter: sliceAddress(vm.voter),
    date: [vm.$moment.unix(vm.timestamp).format('l'), vm.$moment.unix(vm.timestamp).format('hh:mm')].join(' ')
  })
}
</script>

<style lang="scss" scoped>
.proposals-box {
  cursor: default;

  .tag {
    margin: 0;
    width: 100%;
  }

  &--tags {
    display: flex;
    flex-wrap: wrap;
    grid-template-columns: repeat(auto-fill, minmax(100px, auto));
    display: grid;
    grid-row-gap: 0.714rem;
    grid-column-gap: 0.714rem;
  }

  &--date {
    display: flex;
    align-items: center;
  }

  &--title {
    display: flex;
  }

  &--title,
  &--info {
    word-break: break-word;
  }

  &--revote {
    text-decoration: line-through;
  }
}
</style>
