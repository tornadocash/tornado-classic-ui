<template>
  <div class="modal-card box box-modal">
    <header class="box-modal-header">
      <div class="box-modal-title">{{ $t('settings') }}</div>
      <button type="button" class="delete" @click="$parent.cancel('escape')" />
    </header>
    <div class="field">
      <b-field :label="$t('rpc')" class="has-custom-field" data-test="rpc_endpoint_dropdown">
        <b-dropdown v-model="selectedRpc" expanded aria-role="list">
          <div slot="trigger" class="control" :class="{ 'is-loading': checkingRpc && !isCustomRpc }">
            <div class="input">
              <span>{{ isCustomRpc ? $t('customRpc') : selectedRpc }}</span>
            </div>
          </div>
          <b-dropdown-item
            v-for="{ name, url } in Object.values(networkConfig.rpcUrls)"
            :key="name"
            :value="name"
            aria-role="listitem"
            :data-test="`rpc_endpoint_${name}`"
            @click="checkRpc({ name, url })"
          >
            {{ name }}
          </b-dropdown-item>
          <b-dropdown-item
            value="custom"
            aria-role="listitem"
            data-test="rpc_endpoint_custom"
            @click="checkRpc({ name: 'custom' })"
          >
            {{ $t('customRpc') }}
          </b-dropdown-item>
        </b-dropdown>
      </b-field>
      <div v-if="isCustomRpc" class="field has-custom-field">
        <b-input
          ref="customInput"
          v-model="customRpcUrl"
          type="url"
          :placeholder="$t('customRpcPlaceholder')"
          :custom-class="hasErrorRpc.type"
          :use-html5-validation="false"
          @input="checkCustomRpc"
        ></b-input>
      </div>
      <p v-if="hasErrorRpc.msg" class="help" :class="hasErrorRpc.type">
        {{ hasErrorRpc.msg }}
      </p>
    </div>
    <div class="buttons buttons__halfwidth">
      <b-button type="is-primary" outlined data-test="button_reset_rpc" @mousedown.prevent @click="onReset">
        {{ $t('reset') }}
      </b-button>
      <b-button type="is-primary" :disabled="isDisabledSave" data-test="save_rpc_button" @click="onSave">
        {{ $t('save') }}
      </b-button>
    </div>
  </div>
</template>
<script>
/* eslint-disable no-console */
import { mapGetters, mapMutations } from 'vuex'

import { debounce } from '@/utils'
import networkConfig from '@/networkConfig'

export default {
  props: {
    netId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      checkingRpc: false,
      hasErrorRpc: { type: '', msg: '' },
      customRpcUrl: '',
      selectedRpc: 'custom',
      rpc: { name: 'custom', url: '' }
    }
  },
  computed: {
    ...mapGetters('settings', ['getRpc']),
    networkConfig() {
      return networkConfig[`netId${this.netId}`]
    },
    isCustomRpc() {
      return this.selectedRpc === 'custom'
    },
    isDisabledSave() {
      return (
        this.hasErrorRpc.type === 'is-warning' || this.checkingRpc || (this.isCustomRpc && !this.customRpcUrl)
      )
    }
  },
  created() {
    this.rpc = this.getRpc(this.netId)
    this.selectedRpc = this.rpc.name

    if (this.selectedRpc === 'custom') {
      this.$nextTick(() => {
        this.customRpcUrl = this.rpc.url
      })
    }

    this.checkRpc(this.rpc)
  },
  methods: {
    ...mapMutations('settings', ['SAVE_RPC']),
    onReset() {
      this.checkingRpc = false
      this.hasErrorRpc = { type: '', msg: '' }

      this.rpc = Object.entries(this.networkConfig.rpcUrls)[0][1]
      this.selectedRpc = this.rpc.name
      this.checkRpc(this.rpc)
    },
    onSave() {
      this.SAVE_RPC({ ...this.rpc, netId: this.netId })
      this.$emit('close')
    },
    onCancel() {
      this.$emit('cancel')
    },
    checkRpc({ name, url = '' }) {
      if (name === 'custom') {
        this.customRpcUrl = ''
        this.hasErrorRpc = { type: '', msg: '' }
        this.checkingRpc = true
        return
      }

      this._checkRpc({ name, url })
    },
    checkCustomRpc(url) {
      const trimmedUrl = url.trim()
      if (!trimmedUrl) {
        this.hasErrorRpc = { type: '', msg: '' }
        return
      }
      debounce(this._checkRpc, { name: 'custom', url: trimmedUrl })
    },
    async _checkRpc({ name, url }) {
      this.checkingRpc = true
      this.hasErrorRpc = { type: '', msg: '' }

      const { isValid, error } = await this.$store.dispatch('settings/checkRpc', {
        url,
        netId: this.netId
      })

      if (isValid) {
        this.hasErrorRpc.type = 'is-primary'
        this.hasErrorRpc.msg = this.$t('rpcStatusOk')
        this.rpc = { name, url }
      } else {
        this.hasErrorRpc.type = 'is-warning'
        this.hasErrorRpc.msg = error
      }

      this.checkingRpc = false
    }
  }
}
</script>
