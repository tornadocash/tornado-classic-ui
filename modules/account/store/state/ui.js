import { createChainIdState } from '@/utils'

export const initialUiState = {
  addresses: {
    backup: '-',
    connect: '-',
    encrypt: '-'
  },
  isExistAccount: false,
  encryptedPublicKey: '',
  encryptedPrivateKey: '',
  isEnabledSaveFile: true,
  statistic: [],
  isHighlightedNoteAccount: false
}

export const ui = createChainIdState(initialUiState)
