<template>
  <footer class="footer">
    <div class="container">
      <div class="level">
        <div class="level-left">
          <div class="level-item is-column">
            <div class="level-subitem footer-address">
              <div class="footer-address__name">
                {{ $t('donationsAddress') }}
              </div>
              <a
                class="footer-address__value"
                target="_blank"
                :href="addressExplorerUrl(donationsAddress)"
                rel="noopener noreferrer"
                >{{ donationsAddress }}</a
              >
            </div>
            <div class="level-subitem">
              Tornado.cash version:
              <span class="footer-version__value">{{ commit }}</span>
            </div>
          </div>
        </div>
        <div class="level-right">
          <div class="level-item is-column">
            <div class="level-subitem">
              <div class="buttons">
                <b-button
                  tag="a"
                  type="is-icon"
                  :href="duneLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon-right="stats"
                ></b-button>
                <b-button
                  tag="a"
                  type="is-icon"
                  href="https://torn.community"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon-right="discourse"
                ></b-button>
                <b-button
                  tag="a"
                  type="is-icon"
                  href="https://discord.com/invite/TFDrM8K42j"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon-right="discord"
                ></b-button>
                <b-button
                  tag="a"
                  type="is-icon"
                  href="https://tornado-cash.medium.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon-right="medium"
                ></b-button>
                <b-button
                  tag="a"
                  type="is-icon"
                  href="https://twitter.com/TornadoCash"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon-right="twitter"
                ></b-button>
                <b-button
                  tag="a"
                  type="is-icon"
                  href="https://t.me/TornadoCashOfficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon-right="telegram"
                ></b-button>
                <b-button
                  tag="a"
                  type="is-icon"
                  href="https://github.com/tornadocash"
                  target="_blank"
                  rel="noopener noreferrer"
                  icon-right="github"
                ></b-button>
                <div class="break"></div>
                <b-dropdown
                  v-model="$i18n.locale"
                  class="dropdown-langs"
                  position="is-top-left"
                  aria-role="list"
                  @change="langChange"
                >
                  <b-button slot="trigger" type="is-icon">
                    <FlagIcon :code="$i18n.locale" :class="'is-active-locale-' + $i18n.locale" />
                  </b-button>

                  <b-dropdown-item
                    v-for="locale in locales"
                    :key="locale"
                    :value="locale"
                    aria-role="listitem"
                  >
                    <FlagIcon :code="locale" />
                    {{ printLang(locale) }}
                  </b-dropdown-item>
                </b-dropdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
import { mapGetters } from 'vuex'

import { FlagIcon } from '@/components/icons'
import { LOCALES_NAMES, DONATIONS_ADDRESS } from '@/constants'

export default {
  components: {
    FlagIcon
  },
  data() {
    return {
      commit: process.env.commit,
      donationsAddress: DONATIONS_ADDRESS
    }
  },
  computed: {
    ...mapGetters('metamask', ['networkConfig', 'netId']),
    ...mapGetters('txHashKeeper', ['addressExplorerUrl']),
    duneLink() {
      const mainnetNetworks = [1, 5]

      if (mainnetNetworks.includes(Number(this.netId))) {
        return 'https://dune.xyz/poma/tornado-cash_1'
      }

      return 'https://dune.xyz/fennec/Tornado-Cash-Cross-chain-Dashboard'
    },
    locales() {
      return this.$i18n.availableLocales
    }
  },
  methods: {
    langChange(lang) {
      localStorage.setItem('lang', lang)

      if (lang === 'zh') {
        lang += '-cn'
      }

      this.$moment.locale(lang)
      this.$numbro.setLanguage(LOCALES_NAMES[lang])
    },
    printLang(lang) {
      let code = lang
      switch (code) {
        case 'zh':
          code = 'cn'
          break
      }
      return code.toUpperCase()
    }
  }
}
</script>
