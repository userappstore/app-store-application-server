const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    let installids
    if (req.query.all) {
      installids = await userAppStore.StorageList.listAll(`account/installs/${req.query.accountid}`)
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      installids = await userAppStore.StorageList.list(`account/installs/${req.query.accountid}`, offset)
    }
    if (!installids || !installids.length) {
      return null
    }
    const installs = []
    for (const installid of installids) {
      req.query.installid = installid
      const install = await global.api.user.userappstore.Install.get(req)
      installs.push(install)
    }
    return installs
  }
}
