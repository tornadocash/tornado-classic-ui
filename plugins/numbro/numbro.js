import numbro from 'numbro'
import { locales } from './languages'

export default (ctx, inject) => {
  locales.forEach((lang) => {
    numbro.registerLanguage(lang)
  })
  ctx.$numbro = numbro
  inject('numbro', numbro)
}
