const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    let collectionids
    if (req.query.all) {
      collectionids = await userAppStore.StorageList.listAll(`account/collections/${req.query.accountid}`)
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      collectionids = await userAppStore.StorageList.list(`account/collections/${req.query.accountid}`, offset)
    }
    if (!collectionids || !collectionids.length) {
      return null
    }
    const collections = []
    for (const collectionid of collectionids) {
      req.query.collectionid = collectionid
      const collection = await global.api.user.userappstore.Collection.get(req)
      collections.push(collection)
    }
    return collections
  }
}
