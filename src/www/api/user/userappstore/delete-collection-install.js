const userAppStore = require('../../../../../index.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.collectionid) {
      throw new Error('invalid-collectionid')
    }
    if (!req.body || !req.body.installid) {
      throw new Error('invalid-installid')
    }
    const collection = await global.api.user.userappstore.Collection.get(req)
    if (!collection.items || !collection.items.length) {
      throw new Error('invalid-installid')
    }
    const itemIndex = collection.items.indexOf(req.body.installid)
    if (itemIndex < 0) {
      throw new Error('invalid-installid')
    }
    collection.items.splice(itemIndex, 1)
    await userAppStore.Storage.write(`collection/${req.query.collectionid}`, collection)
    req.success = true
    return collection
  }
}
