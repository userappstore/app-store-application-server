const crypto = require('crypto')

module.exports = {
  friendly,
  random,
  v4
}

// this is a Heroku-like friendly ID generator from https://stackoverflow.com/questions/7666516/fancy-name-generator-in-node-js
function friendly () {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const int = Math.floor(Math.random() * 1000) + 999
  return `${adjective}-${noun}-${int}`
}

const adjectives = [
  'autumn', 'hidden', 'bitter', 'misty', 'silent', 'empty', 'dry', 'dark',
  'summer', 'icy', 'delicate', 'quiet', 'white', 'cool', 'spring', 'winter',
  'patient', 'twilight', 'dawn', 'crimson', 'wispy', 'weathered', 'blue',
  'billowing', 'broken', 'cold', 'damp', 'falling', 'frosty', 'green',
  'long', 'late', 'lingering', 'bold', 'little', 'morning', 'muddy', 'old',
  'red', 'rough', 'still', 'small', 'sparkling', 'wobbling', 'shy',
  'wandering', 'withered', 'wild', 'black', 'young', 'holy', 'solitary',
  'fragrant', 'aged', 'snowy', 'proud', 'floral', 'restless', 'divine',
  'polished', 'ancient', 'purple', 'lively', 'nameless'
]
const nouns = [
  'waterfall', 'river', 'breeze', 'moon', 'rain', 'wind', 'sea', 'morning',
  'snow', 'lake', 'sunset', 'pine', 'shadow', 'leaf', 'dawn', 'glitter',
  'forest', 'hill', 'cloud', 'meadow', 'sun', 'glade', 'bird', 'brook',
  'butterfly', 'bush', 'dew', 'dust', 'field', 'fire', 'flower', 'firefly',
  'feather', 'grass', 'haze', 'mountain', 'night', 'pond', 'darkness',
  'snowflake', 'silence', 'sound', 'sky', 'shape', 'surf', 'thunder',
  'violet', 'water', 'wildflower', 'wave', 'water', 'resonance', 'sun',
  'wood', 'dream', 'cherry', 'tree', 'fog', 'frost', 'voice', 'paper',
  'frog', 'smoke', 'star'
]

// via https://github.com/klughammer/node-randomstring/blob/master/lib/charset.js
function random (length) {
  if (!length) {
    return null
  }
  const encodingCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let string = ''
  const buffer = crypto.randomBytes(length)
  for (const byte of buffer) {
    const characterPosition = byte % encodingCharacters.length
    string += encodingCharacters.charAt(characterPosition)
  }
  return string
}

// this is the 'uuid' module v4 function abbreviated from https://github.com/kelektiv/node-uuid/
const byteToHex = []
for (let i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substring(1)
}

function v4 () {
  const buffer = crypto.randomBytes(16)
  buffer[6] = (buffer[6] & 0x0f) | 0x40
  buffer[8] = (buffer[8] & 0x3f) | 0x80
  let i = 0
  return byteToHex[buffer[i++]] + byteToHex[buffer[i++]] +
    byteToHex[buffer[i++]] + byteToHex[buffer[i++]] + '-' +
    byteToHex[buffer[i++]] + byteToHex[buffer[i++]] + '-' +
    byteToHex[buffer[i++]] + byteToHex[buffer[i++]] + '-' +
    byteToHex[buffer[i++]] + byteToHex[buffer[i++]] + '-' +
    byteToHex[buffer[i++]] + byteToHex[buffer[i++]] + byteToHex[buffer[i++]] + byteToHex[buffer[i++]] + byteToHex[buffer[i++]] + byteToHex[buffer[i++]]
}
