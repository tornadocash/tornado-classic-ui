<template>
  <div class="proposal-comments">
    <div class="proposals-list--header proposal-comments--header">
      <b-field class="field-tabs">
        <template v-for="item in tabs">
          <b-radio-button :key="item.id" v-model="currentTab" :native-value="item.id" type="is-primary">
            <span>{{ $t(item.label) }}</span>
          </b-radio-button>
        </template>
      </b-field>
    </div>

    <ProposalCommentsSkeleton v-if="isFetchingComments" :size="comments.length ? 1 : 3" />
    <ProposalComment
      v-for="item in commentsFiltered"
      :key="item.id"
      v-bind="item"
      :loading="isFetchingMessages"
    />
  </div>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import ProposalCommentsSkeleton from './ProposalCommentsSkeleton.vue'
import ProposalComment from './ProposalComment.vue'

const TabTypes = {
  all: 'all',
  for: 'for',
  against: 'against'
}

const TAB_LIST = [
  { id: TabTypes.all, label: 'all' },
  { id: TabTypes.for, label: 'for' },
  { id: TabTypes.against, label: 'against' }
]

export default {
  components: {
    ProposalCommentsSkeleton,
    ProposalComment
  },
  inheritAttrs: false,
  props: {
    proposal: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    tabs: TAB_LIST,
    currentTab: TAB_LIST[0].id
  }),
  computed: {
    ...mapState('governance/proposal', ['isFetchingComments', 'isFetchingMessages']),
    ...mapGetters('governance/proposal', ['comments']),

    commentsFiltered() {
      const { comments } = this

      switch (this.currentTab) {
        case TabTypes.for:
          return comments.filter((_) => _.support === true)

        case TabTypes.against:
          return comments.filter((_) => _.support === false)

        case TabTypes.all:
        default:
          return comments
      }
    }
  },
  created() {
    this.fetchComments(this.proposal)
  },
  methods: {
    ...mapActions('governance/proposal', ['fetchComments'])
  }
}
</script>

<style lang="scss" scoped>
.proposal-comments {
  &--header {
    margin-bottom: 0.5rem;
  }
}
</style>
