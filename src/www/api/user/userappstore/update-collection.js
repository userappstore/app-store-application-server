const userAppStore = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.collectionid) {
      throw new Error('invalid-collectionid')
    }
    if (!req.body || !req.body.name || !req.body.name.trim()) {
      throw new Error('invalid-name')
    }
    if (!req.body.text || !req.body.text.length) {
      throw new Error('invalid-text')
    }
    if (!req.body.background || !req.body.background.length) {
      throw new Error('invalid-background')
    }
    if (!req.body.text.startsWith('#') &&
      !req.body.text.startsWith('rgb(') &&
      !req.body.text.startsWith('rgba(')) {
      throw new Error('invalid-text')
    }
    if (!req.body.background.startsWith('#') &&
      !req.body.background.startsWith('rgb(') &&
      !req.body.background.startsWith('rgba(')) {
      throw new Error('invalid-background')
    }
    const collection = await global.api.user.userappstore.Collection.get(req)
    if (!collection) {
      throw new Error('invalid-collectionid')
    }
    collection.name = req.body.name
    collection.text = req.body.text
    collection.background = req.body.background
    await userAppStore.Storage.write(`collection/${req.query.collectionid}`, collection)
    req.success = true
    return collection
  }
}
