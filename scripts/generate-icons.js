import png2icons from 'png2icons'
import fs from 'fs'

const input = fs.readFileSync('build/icon.png')
fs.writeFileSync('build/icon.icns', png2icons.createICNS(input, png2icons.BICUBIC, 0))
fs.writeFileSync('build/icon.ico', png2icons.createICO(input, png2icons.BICUBIC, 0, true))
console.log('Icons generated')