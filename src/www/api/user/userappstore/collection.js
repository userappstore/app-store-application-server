const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.collectionid) {
      throw new Error('invalid-collectionid')
    }
    let collection = await userAppStore.Storage.read(`collection/${req.query.collectionid}`)
    if (!collection || !collection.length) {
      throw new Error('invalid-collectionid')
    }
    collection = JSON.parse(collection)
    if (collection.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    return collection
  }
}
