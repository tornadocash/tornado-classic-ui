<template>
  <div class="proposals-box">
    <div class="columns is-gapless">
      <div class="column proposals-box--tags">
        <div class="proposals-box--tag-item">
          <div class="tag proposals-box--id">
            <span><number-format :value="votes" /> TORN</span>
          </div>
        </div>

        <div class="proposals-box--tag-item">
          <b-tooltip
            :label="ens.voter || voter"
            position="is-top"
            :multilined="ens.voter && ens.voter.length > 50"
          >
            <a
              target="_blank"
              :href="addressExplorerUrl(voter)"
              rel="noopener noreferrer"
              class="tag proposals-box--id is-link"
              v-text="shortVoter"
            />
          </b-tooltip>
        </div>

        <div v-if="delegator" class="proposals-box--tag-item">
          <b-tooltip
            :label="ens.delegator || delegator"
            position="is-top"
            :multilined="ens.delegator && ens.delegator.length > 50"
          >
            <a
              target="_blank"
              :href="addressExplorerUrl(delegator)"
              rel="noopener noreferrer"
              class="tag proposals-box--id is-link"
              v-text="$t('delegate')"
            />
          </b-tooltip>
        </div>

        <div class="proposals-box--tag-item is-percentage">
          <div class="tag proposals-box--id is-percentage">{{ percentage || '~0.1' }}%</div>
        </div>
      </div>
    </div>

    <div class="proposals-box--comment">
      <b-icon
        :icon="support ? 'check' : 'close'"
        :type="support ? 'is-primary' : 'is-danger'"
        class="proposals-box--status-icon"
      />
      <span v-if="loading" class="proposals-box--skeleton">
        <b-skeleton height="21" width="260" style="width: auto;" />
      </span>
      <template v-else>
        <span v-if="contact" class="proposals-box--title">{{ contact }}</span>
        <span v-if="message" class="proposals-box--info">{{ message }}</span>
        <span v-if="!contact && !message">-</span>
      </template>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { sliceAddress, sliceEnsName } from '@/utils'
import NumberFormat from '@/components/NumberFormat'

export default {
  components: {
    NumberFormat
  },
  inheritAttrs: false,
  props: {
    loading: {
      type: Boolean,
      required: true
    },
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
    votes: {
      type: String,
      required: true
    },
    voter: {
      type: String,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    delegator: {
      type: String,
      default: ''
    },
    ens: {
      type: Object,
      required: true,
      validator: (props) => 'delegator' in props && 'voter' in props
    }
  },
  computed: {
    ...mapGetters('txHashKeeper', ['addressExplorerUrl']),

    shortVoter() {
      return sliceEnsName(this.ens.voter || '') || sliceAddress(this.voter)
    }
  }
}
</script>

<style lang="scss" scoped>
$margin: 0.714rem;

.proposals-box {
  cursor: default;

  .tag {
    width: 100%;
    margin: 0;

    &.is-link {
      text-decoration: none;
      background-color: #363636;
      transition: background-color 0.15s ease-in-out;

      &:hover {
        background-color: rgba(#363636, 0.5);
      }
    }

    &.is-percentage {
      padding: 0;
      margin: 0;
      background: transparent;
      text-align: right;
    }
  }

  .columns {
    margin-bottom: 0;
  }

  &--tags {
    display: flex;
    flex-wrap: wrap;
    margin: calc(#{-$margin * 0.5}) !important;
  }

  &--tag-item {
    margin: calc(#{$margin * 0.5});
    width: auto;
    min-width: 110px;

    @media screen and (max-width: 600px) {
      width: calc(50% - #{$margin});
    }

    & > * {
      display: flex;
      width: 100%;
    }

    &.is-percentage {
      min-width: auto;
      margin-left: auto;
    }
  }

  &--title,
  &--info {
    word-break: break-word;
    display: inline;
  }

  &--status-icon {
    vertical-align: middle;
    margin-bottom: 0.2rem;
  }

  &--comment {
    margin-top: 1.5rem;
  }

  &--skeleton {
    display: inline-block;
  }
}
</style>
