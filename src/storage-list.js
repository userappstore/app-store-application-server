let storageList
if (process.env.STORAGE_ENGINE) {
  storageList = require(process.env.STORAGE_ENGINE).StorageList
} else {
  storageList = require(`./storage-list-fs.js`)
}

module.exports = {
  add,
  count,
  exists,
  list,
  listAll,
  remove
}

async function exists (path, itemid) {
  return storageList.exists(path, itemid)
}

async function add (path, itemid) {
  const added = await exists(path, itemid)
  if (added) {
    return
  }
  return storageList.add(path, itemid)
}

async function count (path) {
  return storageList.count(path)
}

async function listAll (path) {
  const itemids = await storageList.listAll(path)
  if (!itemids || !itemids.length) {
    return null
  }
  for (const i in itemids) {
    if (itemids[i] === 'true' || itemids[i] === 'false') {
      itemids[i] = itemids[i] === 'true'
      continue
    }
    if (itemids[i].indexOf && itemids[i].indexOf('.')) {
      try {
        const float = parseFloat(itemids[i])
        if (float.toString() === itemids[i]) {
          itemids[i] = float
          continue
        }
      } catch (error) {
      }
    }
    if (itemids[i].substring && itemids[i].length) {
      try {
        const int = parseInt(itemids[i], 10)
        if (int.toString() === itemids[i]) {
          itemids[i] = int
          continue
        }
      } catch (error) {
      }
    }
  }
  return itemids
}

async function list(path, offset, pageSize) {
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
  const itemids = await storageList.list(path, offset, pageSize)
  if (!itemids || !itemids.length) {
    return null
  }
  for (const i in itemids) {
    if (itemids[i] === 'true' || itemids[i] === 'false') {
      itemids[i] = itemids[i] === 'true'
      continue
    }
    if (itemids[i].indexOf && itemids[i].indexOf('.')) {
      try {
        const float = parseFloat(itemids[i])
        if (float.toString() === itemids[i]) {
          itemids[i] = float
          continue
        }
      } catch (error) {
      }
    }
    if (itemids[i].substring && itemids[i].length) {
      try {
        const int = parseInt(itemids[i], 10)
        if (int.toString() === itemids[i]) {
          itemids[i] = int
          continue
        }
      } catch (error) {
      }
    }
  }
  return JSON.parse(JSON.stringify(itemids))
}

async function remove (path, itemid) {
  return storageList.remove(path, itemid)
}
