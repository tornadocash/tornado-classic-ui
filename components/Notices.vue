<template>
  <div class="notices is-top">
    <b-notification
      v-for="notice in notices"
      v-show="notice.isShowed"
      :key="notice.id"
      class="is-top-right"
      has-icon
      :icon="notice.type"
      :aria-close-label="$t('closeNotification')"
      role="alert"
      @close="close(notice.id)"
    >
      <span v-if="notice.untranslatedTitle">{{ notice.untranslatedTitle }}</span>
      <i18n v-else :path="notice.title.path || notice.title" tag="span">
        <template v-slot:value>
          <b><number-format :value="notice.title.amount" /> {{ getSymbol(notice.title.currency) }}</b>
        </template>
        <template v-slot:description>{{ notice.description }}</template>
      </i18n>
      <a
        v-if="notice.nova"
        href="https://nova.tornadocash.eth.link"
        target="_blank"
        rel="noopener noreferrer"
      >
        Tornado Cash Nova
      </a>
      <a
        v-if="notice.txHash"
        :href="txExplorerUrl(notice.txHash)"
        target="_blank"
        data-test="popup_message"
        rel="noopener noreferrer"
      >
        {{ $t('viewOnEtherscan') }}
      </a>
      <n-link v-else-if="notice.routerLink" v-bind="notice.routerLink.params" @onClick="$forceUpdate()">
        {{ $t(notice.routerLink.title) }}
      </n-link>
    </b-notification>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import NumberFormat from '@/components/NumberFormat'

export default {
  components: {
    NumberFormat
  },
  computed: {
    ...mapState('notice', ['notices']),
    ...mapGetters('txHashKeeper', ['txExplorerUrl']),
    ...mapGetters('token', ['getSymbol'])
  },
  methods: {
    ...mapActions('notice', ['showNotice']),
    close(id) {
      this.showNotice({ id, isShowed: false })
    }
  }
}
</script>
