export const _debounce = (func, waitFor) => {
  let timeout = null

  const debounceFunction = (...args) => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    timeout = setTimeout(() => {
      return func(...args)
    }, waitFor)
  }

  return debounceFunction
}

export const debounce = _debounce((func, args) => func(args), 400)
