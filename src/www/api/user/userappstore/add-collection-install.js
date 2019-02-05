const userAppStore = require('../../../../../index.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.collectionid) {
      throw new Error('invalid-collectionid')
    }
    if (!req.body || !req.body.installid) {
      throw new Error('invalid-installid')
    }
    try {
      req.query.installid = req.body.installid
      await global.api.user.userappstore.Install.get(req)
    } catch (error) {
      throw new Error('invalid-installid')
    }
    const collection = await global.api.user.userappstore.Collection.get(req)
    collection.items = collection.items || []
    if (collection.items.indexOf(req.body.installid) > -1) {
      throw new Error('duplicate-install')
    }
    collection.items.unshift(req.body.installid)
    await userAppStore.Storage.write(`collection/${req.query.collectionid}`, collection)
    req.success = true
    return collection
  }
}
