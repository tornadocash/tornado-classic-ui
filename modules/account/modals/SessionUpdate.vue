<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <div class="modal-card-title">{{ $parent.$t('account.modals.checkRecoveryKey.title') }}</div>
    </header>
    <section class="modal-card-body">
      <div class="media">
        <div class="media-content">
          {{
            isShow
              ? $parent.$t('account.modals.checkRecoveryKey.inactiveDescription')
              : $parent.$t('account.modals.checkRecoveryKey.description')
          }}
        </div>
      </div>
    </section>
    <footer v-if="isShow" class="modal-card-foot">
      <b-button type="is-primary" outlined @click="$emit('close')">
        {{ $parent.$t('close') }}
      </b-button>
    </footer>
    <footer v-else class="modal-card-foot">
      <b-button type="is-primary" outlined @click="_onCancel">
        {{ $parent.$t('account.modals.checkRecoveryKey.no') }}
      </b-button>
      <b-button type="is-primary" @click="_onConfirm">
        {{ $parent.$t('account.modals.checkRecoveryKey.yes') }}
      </b-button>
    </footer>
  </div>
</template>

<script>
export default {
  props: {
    onCancel: {
      type: Function,
      required: true
    },
    onConfirm: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      timer: null,
      isShow: false
    }
  },
  beforeDestroy() {
    clearTimeout(this.timer)
  },
  mounted() {
    this.timer = setTimeout(() => {
      this.onCancel()
      this.isShow = true
    }, 1000 * 60)
  },
  methods: {
    _onCancel() {
      this.onCancel()
      this.$emit('close')
    },
    _onConfirm() {
      this.onConfirm()
      this.$emit('close')
    }
  }
}
</script>
