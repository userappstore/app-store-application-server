
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
    if (!req.body.serverid || !req.body.serverid.length) {
      throw new Error('invalid-application-serverid')
    }
    if (req.body.appid) {
      if (!req.body.appid.match(/^[a-zA-Z0-9\-]+$/)) {
        throw new Error('invalid-appid')
      }
    }
    if (!req.body.stripeid || !req.body.stripeid.length) {
      throw new Error('invalid-stripeid')
    }
    if (!global.applicationFee) {
      if (req.body.application_fee !== '0.05' &&
        req.body.application_fee !== '0.1' &&
        req.body.application_fee !== '0.15' &&
        req.body.application_fee !== '0.2') {
        throw new Error('invalid-application_fee')
      }
    }
    req.query.serverid = req.body.serverid
    const server = await global.api.user.userappstore.ApplicationServer.get(req)
    if (!server) {
      throw new Error('invalid-application-serverid')
    }
    if (server.appid) {
      throw new Error('duplicate-application-serverid')
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
      serverid: req.body.serverid,
      appid,
      accountid: req.query.accountid,
      created: userAppStore.Timestamp.now,
      applicationFee: global.applicationFee || req.body.Application_fee
    }
    if (server.projectid) {
      appInfo.projectid = server.projectid
    } else if (server.url) {
      appInfo.url = server.url
    }
    await userAppStore.Storage.write(`app/${appid}`, appInfo)
    await userAppStore.StorageObject.setProperties(`server/${req.body.serverid}`, {
      appid,
      stripeid: req.body.stripeid
    })
    await userAppStore.StorageList.add(`account/apps/${req.query.accountid}`, appid)
    await userAppStore.StorageList.add(`stripeid/apps/${req.body.stripeid}`, appid)
    await userAppStore.StorageList.add(`apps`, appid)
    req.success = true
    return appInfo
  }
}
