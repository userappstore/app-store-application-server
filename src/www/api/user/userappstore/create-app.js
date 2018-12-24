
const dashboardServer = require('../../../../dashboard-server.js')
const userAppStore = require('../../../../../index.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    if (!req.body.projectid && !req.body.url) {
      throw new Error('invalid-source')
    }
    if (req.body.projectid) {
      req.query.projectid = req.body.projectid
      const project = await global.api.user.userappstore.Project.get(req)
      if (!project) {
        throw new Error('invalid-projectid')
      }
    } else if (req.body.url) {
      if (req.body.url.indexOf('https://') !== 0) {
        throw new Error('invalid-url')
      }
    } else {
      throw new Error('invalid-source')
    }
    if (req.body.appid) {
      if (!req.body.appid.match(/^[a-zA-Z0-9\-]+$/)) {
        throw new Error('invalid-appid')
      }
    }
    if (!req.body.stripeid || !req.body.stripeid.length) {
      throw new Error('invalid-stripeid')
    }
    req.query.stripeid = req.body.stripeid
    const stripeAccount = await dashboardServer.get(`/api/user/connect/stripe-account?stripeid=${req.body.stripeid}`, req.account.accountid, req.session.sessionid)
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    if (stripeAccount.metadata.accountid !== req.query.accountid) {
      throw new Error('invalid-stripe-account')
    }
    if (!stripeAccount.payouts_enabled) {
      throw new Error('invalid-stripe-account')
    } 
    let appid = req.body.appid || userAppStore.UUID.friendly()
    let exists = await userAppStore.Storage.exists(`app/${appid}`)
    if (exists) {
      if (req.body.appid) {
        throw new Error('duplicate-appid')
      }
      while (exists) {
        appid = userAppStore.UUID.friendly()
        exists = await userAppStore.Storage.exists(`app/${appid}`)
      }
    }
    const appInfo = {
      object: 'app',
      stripeid: req.body.stripeid,
      appid,
      accountid: req.query.accountid,
      timestamp: userAppStore.Timestamp.now
    }
    if (req.body.projectid) {
      appInfo.projectid = req.body.projectid
    } else {
      appInfo.url = req.body.url
    }
    await userAppStore.Storage.write(`app/${appid}`, appInfo)
    await userAppStore.StorageList.add(`account/apps/${req.query.accountid}`, appid)
    await userAppStore.StorageList.add(`apps/${req.query.accountid}`, appid)
    req.success = true
    return appInfo
  }
}
