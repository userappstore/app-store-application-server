const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    let itemids
    if (req.query.all) {
      itemids = await userAppStore.StorageList.listAll(`account/uninstalls/${req.query.accountid}`)
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      itemids = await userAppStore.StorageList.list(`account/uninstalls/${req.query.accountid}`, offset)
    }
    if (!itemids || !itemids.length) {
      return null
    }
    const query = req.query
    req.query = {}
    const uninstalls = []
    for (const itemid of itemids) {
      req.query.uninstallid = itemid
      const uninstall = await global.api.user.userappstore.Uninstall.get(req)
      uninstalls.push(uninstall)
    }
    req.query = query
    return uninstalls
  }
}
