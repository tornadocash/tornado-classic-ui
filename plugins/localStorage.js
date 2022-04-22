/* eslint-disable no-console */
// ~/plugins/localStorage.js
import createPersistedState from 'vuex-persistedstate'

import { isStorageAvailable } from '@/utils'

const { OLD_STORE_NAME, STORE_NAME = 'tornadoClassicV2' } = process.env

function migrate() {
  if (isStorageAvailable('localStorage') && OLD_STORE_NAME !== STORE_NAME) {
    const oldStore = localStorage[OLD_STORE_NAME]
    if (oldStore) {
      localStorage.setItem(STORE_NAME, oldStore)
      localStorage.removeItem(OLD_STORE_NAME)
    }
  }
}

export default ({ store, isHMR }) => {
  if (isHMR) {
    return
  }

  const paths = ['metamask.netId', 'application.selectedStatistic', 'application.selectedInstance']

  if (!store.$isLoadedFromIPFS()) {
    paths.push('txHashKeeper', 'settings', 'account', 'relayer.jobs', 'encryptedNote.ui')
  }

  migrate()

  createPersistedState({
    key: STORE_NAME,
    paths
  })(store)
}
