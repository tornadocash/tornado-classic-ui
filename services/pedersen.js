import { buildPedersenHash } from 'circomlibjs'

class Pedersen {
  constructor() {
    this.pedersenHash = null
    this.babyJub = null
    this.initPedersen()
  }

  async initPedersen() {
    this.pedersenHash = await buildPedersenHash()
    this.babyJub = this.pedersenHash.babyJub
  }

  unpackPoint(buffer) {
    return this.babyJub.unpackPoint(this.pedersenHash.hash(buffer))
  }

  toStringBuffer(buffer) {
    return this.babyJub.F.toString(buffer)
  }
}

const pedersen = new Pedersen()

export { pedersen }
