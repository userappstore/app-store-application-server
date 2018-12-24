const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.collectionid) {
      throw new Error('invalid-collectionid')
    }
    const collection = await global.api.user.userappstore.Collection.get(req)
    if (!collection) {
      throw new Error('invalid-collectionid')
    }
    return collection.items ? collection.items.length : 0
  }
}
