import { buildMimcSponge } from 'circomlibjs'

class Mimc {
  constructor() {
    this.sponge = null
    this.hash = null
    this.initMimc()
  }

  async initMimc() {
    this.sponge = await buildMimcSponge()
    this.hash = (left, right) => this.sponge.F.toString(this.sponge.multiHash([BigInt(left), BigInt(right)]))
  }
}

const mimc = new Mimc()

export { mimc }
