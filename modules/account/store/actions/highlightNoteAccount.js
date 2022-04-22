export function highlightNoteAccount({ dispatch }, { isHighlighted }) {
  dispatch('createMutation', { type: 'SET_HIGHLIGHT_NOTE_ACCOUNT', payload: { isHighlighted } })
}
