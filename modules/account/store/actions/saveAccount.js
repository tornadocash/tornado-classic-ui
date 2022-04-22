export function saveAccount({ dispatch, rootState }, { account, address, backup }) {
  const { ethAccount } = rootState.metamask

  dispatch('createMutation', {
    type: 'SET_ENCRYPTED_ACCOUNT',
    payload: account
  })

  dispatch('createMutation', {
    type: 'SET_ADDRESSES',
    payload: {
      addresses: {
        encrypt: address,
        backup: backup || '-',
        connect: ethAccount
      }
    }
  })
}
