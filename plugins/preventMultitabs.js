/* eslint-disable no-console */
export default ({ store, isHMR, app }, inject) => {
  inject('preventMultitabs', main)
}
function main(store) {
  const id = Date.now()
  window.id = id
  window.localStorage.setItem('firstTab', id)

  const onLocalStorageEvent = function(e) {
    // the second tab will write its id to this key. The first one will notice it
    if (e.key === 'firstTab') {
      const newID = Date.now()
      console.log('Another tab detected. Setting the new page id', newID)
      setTimeout(() => {
        window.localStorage.secondTab = newID // this is going to be a message for the second tab
      }, 200)
    }

    // the second tab proccesses the message
    if (e.key === 'secondTab' && window.id.toString() === window.localStorage.firstTab) {
      console.log('There is another tab that already opened. We will close this one')
      window.multipleTabsDetected = true
      window.onbeforeunload = null
      window.alert(
        'Multiple tabs opened. Your page will be closed. Please only use single instance of https://tornado.cash'
      )
      window.location = 'https://twitter.com/tornadocash'
    }
  }

  // this event will only trigger when a window other than itself makes changes to local storage.
  setTimeout(() => {
    window.addEventListener('storage', onLocalStorageEvent, false)
  }, 100)
}
