const userAppStore = require('../../../../../index.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
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
    let collectionid = `collection_${userAppStore.UUID.random(16)}`
    let exists = await userAppStore.Storage.exists(`collection/${collectionid}`)
    if (exists) {
      while (exists) {
        collectionid = userAppStore.UUID.friendly()
        exists = await userAppStore.Storage.exists(`collection/${collectionid}`)
      }
    }
    const collectionInfo = {
      object: 'collection',
      collectionid,
      name: req.body.name,
      text: req.body.text,
      background: req.body.background,
      created: userAppStore.Timestamp.now,
      accountid: req.account.accountid
    }
    await userAppStore.Storage.write(`collection/${collectionid}`, collectionInfo)
    await userAppStore.StorageList.add(`account/collections/${req.query.accountid}`, collectionid)
    await userAppStore.StorageList.add(`collections`, collectionid)
    req.success = true
    return collectionInfo
  }
}
