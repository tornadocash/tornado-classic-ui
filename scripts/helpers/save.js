import fs from 'fs'
import zipper from 'zip-local'

export function save(fileName) {
  try {
    zipper.sync
      .zip(`${fileName}`)
      .compress()
      .save(`${fileName}.zip`)

    fs.unlinkSync(fileName)
    return true
  } catch (err) {
    console.log('on save error', fileName, err.message)
    return false
  }
}
