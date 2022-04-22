import { domain } from './Domain'
import { statistic } from './Statistic'
import { addresses } from './Addresses'
import { enabledSaveFile } from './EnabledSaveFile'
import { encryptedAccount } from './EncryptedAccount'

export const mutations = {
  ...domain,
  ...addresses,
  ...statistic,
  ...enabledSaveFile,
  ...encryptedAccount
}
