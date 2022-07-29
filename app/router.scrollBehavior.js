const routerScrollBehavior = (to, from, savedPosition) => {
  if (to.name === 'governance-id') {
    return { x: 0, y: 0 }
  }

  return savedPosition || { x: 0, y: 0 }
}

export default routerScrollBehavior
