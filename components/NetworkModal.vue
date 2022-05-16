<template>
  <div class="modal-card box box-modal is-wallet-modal">
    <header class="box-modal-header is-spaced">
      <p class="box-modal-title has-text-centered">{{ $t('changeNetwork') }}</p>
      <button class="delete" type="button" @click="$emit('close')" />
    </header>
    <div class="networks">
      <div
        v-for="{ name, chainId, dataTest } in networks"
        :key="chainId"
        class="item"
        :class="{ 'is-active': chainId === netId }"
        :data-test="dataTest"
        @click="setNetwork(chainId)"
      >
        <b-icon class="network-icon" :icon="`${name}`.replace(/\)?\s\(?/g, '-').toLowerCase()" />
        <b>{{ name }}</b>
        <span class="network-checkbox"></span>
      </div>
    </div>
  </div>
</template>
<script>
import { mapState, mapActions, mapGetters } from 'vuex'

import { sleep } from '@/utils'
import config from '@/networkConfig'

export default {
  data() {
    return {
      isLoading: false,
      networkConfig: config
    }
  },
  computed: {
    ...mapGetters('metamask', ['netId', 'isLoggedIn']),
    ...mapState('metamask', ['isInitialized']),
    networks() {
      return Object.keys(this.networkConfig).map((key) => {
        return {
          name: this.networkConfig[key].networkName,
          dataTest: `${this.networkConfig[key].networkName.split(' ').join('_')}__network`,
          chainId: Number(key.replace('netId', ''))
        }
      })
    }
  },
  methods: {
    ...mapActions('metamask', ['networkChangeHandler']),
    ...mapActions('loading', ['enable', 'disable']),
    async setNetwork(netId) {
      this.enable({ message: this.$t('changingNetwork') })

      await sleep(800)

      try {
        const providerName = window.localStorage.getItem('provider')
        const isSupport = this.checkSupportNetwork(netId)

        if (isSupport) {
          await this.networkChangeHandler({ netId })

          if (!providerName) {
            this.$router.go(0)
          }
        }
      } catch (err) {
        console.log(`setNetwork has error ${err.message}`)
      } finally {
        this.$emit('close')
        this.disable()
      }
    },
    checkSupportNetwork(netId) {
      const isSupport = Object.keys(this.networkConfig).includes(`netId${netId}`)

      if (!isSupport) {
        this.$buefy.snackbar.open({
          message: this.$i18n.t('currentNetworkIsNotSupported'),
          type: 'is-primary',
          position: 'is-top',
          indefinite: true,
          actionText: 'Ok'
        })
      }

      return isSupport
    }
  }
}
</script>
<style lang="scss" scoped>
.box-modal {
  max-width: 300px;
  margin: 0 auto !important;
}
.item {
  cursor: pointer;
  text-align: center;
  margin: 14px 0;
  display: flex;
  align-items: center;
  font-size: 0.929rem;

  b {
    font-weight: 400;
  }

  .network-icon {
    margin-right: 12px;

    ::v-deep .trnd {
      height: 1.571rem;
      width: 1.571rem;
    }
  }

  .network-checkbox {
    margin-left: auto;
    height: 22px;
    width: 22px;
    border-radius: 100%;
    border: 1px solid #6b6b6b;
    transition: border-color 0.15s ease-in-out;
  }

  &.is-active {
    .network-checkbox {
      border-color: #94febf;
      background-color: #94febf;
      background-image: url('../assets/img/icons/checkbox.svg');
      background-position: center;
      background-repeat: no-repeat;
    }
  }

  &:hover {
    .network-checkbox {
      border-color: #94febf;
    }
  }
}
</style>
