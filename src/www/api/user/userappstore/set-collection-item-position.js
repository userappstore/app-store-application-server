const userAppStore = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.collectionid) {
      throw new Error('invalid-collectionid')
    }
    if (!req.body || !req.body.installid) {
      throw new Error('invalid-installid')
    }
    if (!req.body.position) {
      throw new Error('invalid-position')
    }
    let position
    try {
      position = parseInt(req.body.position, 10)
      position--
    } catch (error) {
      throw new Error('invalid-position')
    }
    const collection = await global.api.user.userappstore.Collection.get(req)
    if (!collection.items || !collection.items.length) {
      throw new Error('invalid-installid')
    }
    if (position < 0 || position >= collection.items.length) {
      throw new Error('invalid-position')
    }
    const itemIndex = collection.items.indexOf(req.body.installid)
    if (itemIndex === -1) {
      throw new Error('invalid-installid')
    }
    if (position === itemIndex) {
      return collection
    }
    collection.items.splice(itemIndex, 1)
    collection.items.splice(position, 0, req.body.installid)
    await userAppStore.Storage.write(`collection/${req.query.collectionid}`, collection)
    return collection
  }
}
