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
    if (!req.body) {
      throw new Error('invalid-source')
    }
    if (!req.body.projectid && !req.body.appid && !req.body.url) {
      throw new Error('invalid-source')
    }
    let sources = 0
    if (req.body.projectid) {
      sources++
    }
    if (req.body.appid) {
      sources++
    }
    if (req.body.url) {
      sources++
    }
    if (sources > 1) {
      throw new Error('invalid-source')
    }
    let installid = req.body.installid || userAppStore.UUID.friendly()
    let exists = await userAppStore.Storage.exists(`install/${installid}`)
    if (exists) {
      if (req.body.installid) {
        throw new Error('duplicate-installid')
      }
      while (exists) {
        installid = userAppStore.UUID.friendly()
        exists = await userAppStore.Storage.exists(`install/${installid}`)
      }
    }
    const installInfo = {
      object: 'install',
      installid: installid,
      created: userAppStore.Timestamp.now,
      accountid: req.query.accountid,
      text: req.body.text
    }
    // installing a project
    if (req.body.projectid) {
      installInfo.projectid = req.body.projectid
      req.query.projectid = req.body.projectid
      await global.api.user.userappstore.SharedProject.get(req)
    }
    // installing an app
    if (req.body.appid) {
      installInfo.appid = req.body.appid
      req.query.appid = req.body.appid
      await global.api.user.userappstore.PublishedApp.get(req)
    }
    // installing a URL
    if (req.body.url) {
      if (!req.body.url.startsWith('https://')) {
        throw new Error('invalid-url')
      }
      installInfo.url = req.body.url
    }
    if (!installInfo.appid && !installInfo.projectid && !installInfo.url) {
      throw new Error('invalid-source')
    }
    // putting the link in a collection
    if (req.body.collectionid) {
      req.query.collectionid = req.body.collectionid
      try {
        await global.api.user.userappstore.Collection.get(req)
      } catch (error) {
        throw new Error('invalid-collectionid')
      }
    }
    // installing for an organization
    if (req.body.organizationid && req.body.organizationid !== 'personal') {
      installInfo.organizationid = req.body.organizationid
      try {
        await dashboardServer.get(`/api/user/organizations/organization?organizationid=${req.body.organizationid}`, req.account.accountid, req.session.sessionid)
      } catch (error) {
        throw new Error('invalid-organizationid')
      }
    }
    // setting up a paid or free subscription
    if (req.body.planid) {
      installInfo.planid = req.body.planid
      try {
        await dashboardServer.get(`/api/user/${req.query.appid}/subscriptions/published-plan?planid=${req.body.planid}`, req.account.accountid, req.session.sessionid)
      } catch (error) {
        throw new Error('invalid-planid')
      }
    }
    // subscribing for organization members
    if (req.body.organizationid && req.body.organizationid !== 'personal' && req.body.planid) {
      installInfo.subscriptions = []
      const memberships = await dashboardServer.get(`/api/user/organizations/organization-memberships?organizationid=${req.body.organizationid}`, req.account.accountid, req.session.sessionid)
      if (memberships && memberships.length) {
        for (const membership of memberships) {
          if (req.body[`member-${membership.membershipid}`]) {
            installInfo.subscriptions.push(membership.membershipid)
          }
        }
      }
    }
    await userAppStore.Storage.write(`install/${installid}`, installInfo)
    await userAppStore.StorageList.add(`account/installs/${req.query.accountid}`, installid)
    if (req.body.collectionid) {
      req.body.installid = install.installid
      await global.api.user.userappstore.AddCollectionItem.post(req)
    }
    req.success = true
    return installInfo
  }
}
