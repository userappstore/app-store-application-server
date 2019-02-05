const dashboardServer = require('../../../../dashboard-server.js')
const userAppStore = require('../../../../../index.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.installid) {
      throw new Error('invalid-installid')
    }
    if (!req.body) {
      throw new Error('invalid-source')
    }
    const install = await global.api.user.userappstore.OrganizationInstall.get(req)
    if (!install) {
      throw new Error('invalid-installid')
    }
    if (!install.subscriptions || !install.subscriptions.length) {
      throw new Error('invalid-install')
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
      text: req.body.text,
      organizationid: install.organizationid,
      organizationInstall: req.query.installid,
      subscriptionid: install.subscriptionid
    }
    // installing a shared project
    if (install.projectid) {
      installInfo.projectid = req.body.projectid
      installInfo.type = 'project'
      req.query.projectid = req.body.projectid
      const project = await global.api.user.userappstore.SharedProject.get(req)
      if (!project) {
        throw new Error('invalid-projectid')
      }
    } else if (install.appid) {
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
      if (app.projectid) {
        installInfo.projectid = app.projectid
      }
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
    await userAppStore.Storage.write(`install/${installid}`, installInfo)
    await userAppStore.StorageList.add(`installs`, installid)
    await userAppStore.StorageList.add(`account/installs/${req.query.accountid}`, installid)
    await userAppStore.StorageList.remove(`account/organization-installs-unconfigured/${req.account.accountid}`, install.installid)
    if (req.body.collectionid) {
      req.body.installid = installid
      await global.api.user.userappstore.AddCollectionItem.post(req)
    }
    req.success = true
    return installInfo
  }
}
