export function redirectToAccount({ dispatch }) {
  dispatch('highlightNoteAccount', { isHighlighted: true })
  this.$router.push({ path: '/account' })
}
