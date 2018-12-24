const userAppStore = require('../../../../../index.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.collectionid) {
      throw new Error('invalid-collectionid')
    }
    const collection = await global.api.user.userappstore.Collection.get(req)
    if (!collection) {
      throw new Error('invalid-collectionid')
    }
    await userAppStore.Storage.deleteFile(`collection/${req.query.collectionid}`)
    await userAppStore.StorageList.remove(`account/collections/${collection.accountid}`, req.query.collectionid)
    await userAppStore.StorageList.remove(`collections`, req.query.collectionid)
    req.success = true
  }
}
