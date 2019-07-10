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
      if (!req.body.url.length || !req.body.url.startsWith('https://')) {
        throw new Error('invalid-url')
      }
      if (req.body.url.length > 200) {
        throw new Error('invalid-url-length')
      }
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
    let applicationServer
    const installInfo = {
      object: 'install',
      installid: installid,
      created: userAppStore.Timestamp.now,
      accountid: req.query.accountid,
      text: req.body.text
    }
    // installing a shared project
    if (req.body.projectid) {
      installInfo.projectid = req.body.projectid
      installInfo.type = 'project'
      req.query.projectid = req.body.projectid
      const project = await global.api.user.userappstore.SharedProject.get(req)
      if (!project) {
        throw new Error('invalid-projectid')
      }
      // load or create the application server
      try {
        req.query.projectid = req.body.projectid
        applicationServer = await global.api.user.userappstore.ProjectApplicationServer.get(req)
      } catch (error) {
        if (error.message !== 'invalid-projectid') {
          throw error
        }
      }
    }
    // installing from the app store
    if (req.body.appid) {
      installInfo.appid = req.body.appid
      installInfo.type = 'app'
      installInfo.server = 'proxy'
      req.query.appid = req.body.appid
      const app = await global.api.user.userappstore.PublishedApp.get(req)
      if (!app) {
        throw new Error('invalid-appid')
      }
      // load the application server
      req.query.serverid = app.serverid
      applicationServer = await global.api.user.userappstore.ApplicationServer.get(req)
    }
    // importing a URL
    if (req.body.url && req.body['application-server'] === 'proxy') {
      installInfo.url = req.body.url
      installInfo.type = 'url'
      // load or create the application server
      try {
        req.query.url = req.body.url
        applicationServer = await global.api.user.userappstore.UrlApplicationServer.get(req)
      } catch (error) {
        if (error.message !== 'invalid-url') {
          throw error
        }
      }
    }
    if (req.body['application-server'] !== 'iframe') {
      if (!applicationServer) {
        applicationServer = await global.api.user.userappstore.CreateApplicationServer.post(req)
      }
      installInfo.serverid = applicationServer.serverid
    } else {
      installInfo.url = req.body.url
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
    let membershipid
    if (req.body.organizationid && req.body.organizationid !== 'personal') {
      installInfo.organizationid = req.body.organizationid
      let organization
      try {
        organization = await dashboardServer.get(`/api/user/organizations/organization?organizationid=${req.body.organizationid}`, req.account.accountid, req.session.sessionid)
      } catch (error) {
      }
      if(!organization) {
        throw new Error('invalid-organization')
      }
      installInfo.subscriptions = []
      const memberships = await dashboardServer.get(`/api/user/organizations/organization-memberships?organizationid=${req.body.organizationid}`, req.account.accountid, req.session.sessionid)
      if (memberships && memberships.length) {
        for (const membership of memberships) {
          if (membership.accountid === req.account.accountid) {
            membershipid = membership.membershipid
            continue
          }
          if (req.body[`member-${membership.membershipid}`]) {
            installInfo.subscriptions.push(membership.membershipid)
          }
        }
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
    await userAppStore.Storage.write(`install/${installid}`, installInfo)
    await userAppStore.StorageList.add(`installs`, installid)
    await userAppStore.StorageList.add(`account/installs/${req.query.accountid}`, installid)
    if (req.body.collectionid) {
      req.body.installid = installid
      await global.api.user.userappstore.AddCollectionInstall.post(req)
    }
    if (installInfo.organizationid) {
      await userAppStore.StorageList.add(`organization/installs/${installInfo.organizationid}`, installid)
      await userAppStore.StorageList.add(`organization/app/members/${installInfo.appid}/${installInfo.organizationid}`, membershipid)
      if (installInfo.subscriptions && installInfo.subscriptions.length) {
        for (const includedMember of installInfo.subscriptions) {
          await userAppStore.StorageList.add(`organization/app/members/${installInfo.appid}/${installInfo.organizationid}`, includedMember)
        }
      }      
    }
    req.success = true
    return installInfo
  }
}
