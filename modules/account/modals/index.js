import { ModalProgrammatic, DialogProgrammatic } from 'buefy'

import { Settings } from '../dependencies'

import DecryptInfo from './DecryptInfo.vue'
import SetupAccount from './SetupAccount.vue'
import SessionUpdate from './SessionUpdate.vue'
import RecoverAccount from './RecoverAccount.vue'
import ShowRecoverKey from './ShowRecoverKey.vue'

const openSettingsModal = ({ parent, ...props }) => {
  createModal({ props, parent, component: Settings })
}

const openSetupAccountModal = ({ parent, ...props }) => {
  createModal({ props, parent, component: SetupAccount, canCancel: false })
}

const openDecryptModal = ({ parent, ...props }) => {
  createModal({ props, parent, component: DecryptInfo })
}

const openRecoverAccountModal = ({ parent, ...props }) => {
  createModal({ props, parent, component: RecoverAccount })
}

const openShowRecoverKeyModal = ({ parent, ...props }) => {
  createModal({ props, parent, component: ShowRecoverKey })
}

function createModal({ component, props, parent, ...rest }) {
  ModalProgrammatic.open({
    props,
    parent,
    component,
    width: 440,
    hasModalCard: true,
    customClass: 'is-pinned',
    ...rest
  })
}

const openRemoveAccountModal = ({ i18n, onConfirm }) => {
  DialogProgrammatic.confirm({
    onConfirm,
    title: i18n.t('account.modals.removeAccount.title'),
    type: 'is-primary is-outlined',
    message: i18n.t('account.modals.removeAccount.description'),
    cancelText: i18n.t('account.modals.removeAccount.cancel'),
    confirmText: i18n.t('account.modals.removeAccount.remove')
  })
}

const openConfirmModal = ({ parent, ...props }) => {
  createModal({ props, parent, component: SessionUpdate, customClass: 'dialog' })
}

export {
  openDecryptModal,
  openConfirmModal,
  openSettingsModal,
  openSetupAccountModal,
  openRemoveAccountModal,
  openShowRecoverKeyModal,
  openRecoverAccountModal
}
