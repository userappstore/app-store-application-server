const crypto = require('crypto')
let storage
if (process.env.STORAGE_ENGINE) {
  storage = require(process.env.STORAGE_ENGINE).Storage
} else {
  storage = require(`./storage-fs.js`)
}

module.exports = {
  setup: storage.setup,
  exists: async (file) => {
    if (!file) {
      throw new Error('invalid-file')
    }
    return storage.exists(file)
  },
  read: async (file) => {
    if (!file) {
      throw new Error('invalid-file')
    }
    const exists = await module.exports.exists(file)
    if (!exists) {
      return undefined
    }
    const contents = await storage.read(file)
    if (!contents) {
      return null
    }
    return decrypt(contents)
  },
  readImage: async (file) => {
    if (!file) {
      throw new Error('invalid-file')
    }
    return storage.readImage(file)
  },
  write: async (file, contents) => {
    if (!file) {
      throw new Error('invalid-file')
    }
    if (!contents && contents !== '') {
      throw new Error('invalid-contents')
    }
    if (contents && !contents.substring) {
      contents = JSON.stringify(contents)
    }
    return storage.write(file, encrypt(contents))
  },
  writeImage: async (file, buffer) => {
    if (!file) {
      throw new Error('invalid-file')
    }
    if (!buffer) {
      throw new Error('invalid-buffer')
    }
    return storage.writeImage(file, buffer)
  },
  deleteFile: async (file) => {
    if (!file) {
      throw new Error('invalid-file')
    }
    return storage.deleteFile(file)
  }
}

function decrypt (value) {
  if (!process.env.ENCRYPTION_KEY) {
    return value
  }
  try {
    return crypto.createDecipher('aes-256-ctr', process.env.ENCRYPTION_KEY).update(value.toString('hex'), 'hex', 'utf-8')
  } catch (error) {
  }
  return value
}

function encrypt (value) {
  if (!process.env.ENCRYPTION_KEY) {
    return value
  }
  if (!value.substring) {
    value = value.toString()
  }
  return crypto.createCipher('aes-256-ctr', process.env.ENCRYPTION_KEY).update(value, 'utf-8', 'hex')
}
