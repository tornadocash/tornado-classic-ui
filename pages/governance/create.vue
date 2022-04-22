<template>
  <div>
    <b-button type="is-back" icon-left="arrow-left" @click="onBack">
      {{ $t('back') }}
    </b-button>
    <CreateProposal @onBack="onBack" />
  </div>
</template>

<script>
import CreateProposal from '@/components/governance/CreateProposal'

export default {
  components: {
    CreateProposal
  },
  methods: {
    onBack() {
      this.$router.push({ path: '/governance' })
    }
  }
}
</script>
