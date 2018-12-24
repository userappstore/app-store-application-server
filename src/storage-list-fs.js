const fs = require('fs')
const path = require('path')
const Storage = require('./storage.js')

// The main Storage class will add the storagePath prefix automatically
// for 'add' and 'remove' as they directly proxy read and write, but for
// other commands the storagePath needs to be included
const storagePath = process.env.STORAGE_PATH || path.join(__dirname, '../data')

module.exports = {
  add,
  count,
  exists,
  list,
  listAll,
  remove
}

async function exists(path, itemid) {
  return fs.existsSync(`${storagePath}/${path}/${itemid}`)
}

async function add(path, itemid) {
  if (!fs.existsSync(`${storagePath}/${path}`)) {
    return Storage.write(`${path}/${itemid}`, '')
  }
  const added = await exists(path, itemid)
  if (added) {
    return
  }
  return Storage.write(`${path}/${itemid}`, '')
}

async function count(path) {
  if (!fs.existsSync(`${storagePath}/${path}`)) {
    return 0
  }
  const items = await fs.readdirSync(`${storagePath}/${path}`)
  if (!items || !items.length) {
    return 0
  }
  return items.length
}

async function listAll(path) {
  if (!fs.existsSync(`${storagePath}/${path}`)) {
    return null
  }
  const itemids = await fs.readdirSync(`${storagePath}/${path}`)
  if (!itemids || !itemids.length) {
    return null
  }
  const cache = {}
  itemids.sort((file1, file2) => {
    const time1 = cache[file1] = cache[file1] || fs.statSync(`${storagePath}/${path}/${file1}`).mtime.getTime()
    const time2 = cache[file2] = cache[file2] || fs.statSync(`${storagePath}/${path}/${file2}`).mtime.getTime()
    return time1 < time2 ? 1 : -1
  })
  return itemids
}

async function list(path, offset, pageSize) {
  if (!fs.existsSync(`${storagePath}/${path}`)) {
    return null
  }
  offset = offset || 0
  if (pageSize === null || pageSize === undefined) {
    pageSize = global.pageSize
  }
  if (offset < 0) {
    throw new Error('invalid-offset')
  }
  if (offset && offset >= pageSize) {
    throw new Error('invalid-offset')
  }
  if (!fs.existsSync(`${storagePath}/${path}`)) {
    return null
  }
  const itemids = await fs.readdirSync(`${storagePath}/${path}`)
  if (!itemids || !itemids.length) {
    return null
  }
  const cache = {}
  itemids.sort((file1, file2) => {
    const time1 = cache[file1] = cache[file1] || fs.statSync(`${storagePath}/${path}/${file1}`).mtime.getTime()
    const time2 = cache[file2] = cache[file2] || fs.statSync(`${storagePath}/${path}/${file2}`).mtime.getTime()
    return time1 < time2 ? 1 : -1
  })
  if (offset) {
    itemids.splice(0, offset)
  }
  if (pageSize > 0) {
    itemids.splice(pageSize, itemids.length - pageSize)
  }
  if (!itemids || !itemids.length) {
    return null
  }
  return itemids
}

async function remove(path, itemid) {
  if (!fs.existsSync(`${storagePath}/${path}`) || !fs.existsSync(`${storagePath}/${path}/${itemid}`)) {
    return
  }
  return Storage.deleteFile(`${path}/${itemid}`)
}
