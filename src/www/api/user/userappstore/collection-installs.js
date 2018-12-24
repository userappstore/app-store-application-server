module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.collectionid) {
      throw new Error('invalid-collectionid')
    }
    const collection = await global.api.user.userappstore.Collection.get(req)
    if (collection.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    if (!collection.items || !collection.items.length) {
      return null
    }
    const installs = []
    for (const installid of collection.items) {
      req.query.installid = installid
      const install = await global.api.user.userappstore.Install.get(req)
      installs.push(install)
    }
    return installs
  }
}
