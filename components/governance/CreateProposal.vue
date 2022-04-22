<template>
  <div class="proposal">
    <h1 class="title">{{ $t('createProposal') }}</h1>

    <div class="columns is-multiline">
      <div class="column is-6">
        <b-field
          :label="$t('proposalTitle')"
          :message="isValidTitle ? '' : $t('proposal.error.title')"
          :type="{ 'is-warning': !isValidTitle }"
        >
          <b-input v-model="validTitle" :placeholder="$t('title')"></b-input>
        </b-field>
      </div>
      <div class="column is-6">
        <b-field
          :label="$t('proposalAddress')"
          :type="{ 'is-warning': !hasValidAddress }"
          :message="hasValidAddress ? '' : addressErrorMessage"
        >
          <b-input
            v-model="address"
            :placeholder="$t('proposalAddress')"
            :size="!address ? '' : hasValidAddress ? '' : 'is-warning'"
          ></b-input>
        </b-field>
      </div>
      <div class="column is-12">
        <b-field
          :message="isValidDescription ? '' : $t('proposal.error.description')"
          :type="{ 'is-warning': !isValidDescription }"
          :label="$t('proposalDescription')"
        >
          <b-input v-model="validDescription" maxlength="2000" type="textarea"></b-input>
        </b-field>
      </div>
    </div>
    <b-tooltip :label="`${$t('onlyOneProposalErr')}`" position="is-top" :active="cannotCreate" multilined>
      <b-button
        :disabled="cannotCreate"
        type="is-primary"
        :icon-left="isFetchingBalances ? '' : 'plus'"
        outlined
        :loading="isFetchingBalances"
        @click="onCreateProposal"
      >
        {{ $t('createProposal') }}
      </b-button>
    </b-tooltip>
  </div>
</template>
<script>
import { mapActions, mapState, mapGetters } from 'vuex'
import { debounce } from '@/utils'

const { isAddress } = require('web3-utils')

export default {
  data() {
    return {
      proposalAddress: '',
      description: '',
      title: '',
      isValidAddress: true,
      isValidContract: true,
      isValidTitle: true,
      isValidDescription: true
    }
  },
  computed: {
    ...mapState('governance/gov', ['latestProposalId']),
    ...mapGetters('governance/gov', ['isFetchingBalances']),
    address: {
      get() {
        return this.proposalAddress
      },
      set(address) {
        this.setInitialState()
        this.proposalAddress = address

        debounce(this.validateAddress, address)
      }
    },
    validTitle: {
      get() {
        return this.title
      },
      set(title) {
        this.isValidTitle = true
        this.title = title
      }
    },
    addressErrorMessage() {
      if (!this.isValidAddress) {
        return this.$t('proposal.error.address')
      }

      if (!this.isValidContract) {
        return this.$t('proposal.error.contract')
      }

      return this.$t('proposal.error.address')
    },
    validDescription: {
      get() {
        return this.description
      },
      set(description) {
        this.isValidDescription = true
        this.description = description
      }
    },
    hasValidAddress() {
      return this.isValidAddress && this.isValidContract
    },
    cannotCreate() {
      return (
        this.latestProposalId.value !== 0 &&
        (this.latestProposalId.status === 'active' || this.latestProposalId.status === 'pending')
      )
    }
  },
  methods: {
    ...mapActions('governance/gov', ['createProposal']),
    async addressIsContract(address) {
      if (!address) {
        return false
      }

      const code = await this.$provider.web3.eth.getCode(address)

      return code !== '0x'
    },
    isAddress(address) {
      const isCorrect = isAddress(address)

      if (!isCorrect && address) {
        this.isValidAddress = isCorrect
      }

      return isCorrect
    },
    async isContract(address) {
      const isContract = await this.addressIsContract(address)

      if (!isContract && address) {
        this.isValidContract = isContract
      }

      return isContract
    },
    setInitialState() {
      this.isValidAddress = true
      this.isValidContract = true
    },
    async validateAddress(address) {
      const isCorrect = this.isAddress(address)

      if (!isCorrect) {
        return false
      }

      const isContract = await this.isContract(address)

      return isContract
    },
    async validationForms() {
      this.isValidTitle = this.title
      this.isValidDescription = this.description
      this.isValidAddress = this.proposalAddress

      const isCorrect = await this.validateAddress(this.proposalAddress)

      return isCorrect && this.isValidAddress && this.isValidTitle && this.isValidDescription
    },
    async onCreateProposal() {
      const isValidForms = await this.validationForms()

      if (!isValidForms) {
        return
      }

      this.$store.dispatch('loading/enable', { message: this.$t('preparingTransactionData') })

      await this.createProposal({
        proposalAddress: this.proposalAddress,
        title: this.title,
        description: this.description
      })
      this.$store.dispatch('loading/disable')
      // this.$parent.close()
    }
  }
}
</script>
