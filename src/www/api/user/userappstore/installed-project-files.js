const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.projectid) {
      throw new Error('invalid-projectid')
    }
    req.query.accountid = req.account.accountid
    const installs = await global.api.user.userappstore.Installs.get(req)
    let found
    for (const install of installs) {
      if (install.projectid && install.projectid !== req.query.projectid) {
        continue
      }
      if (install.projectid === req.query.projectid) {
        found = true
        break
      }
      if (install.appid) {
        req.query.appid = install.appid
        const app = await global.api.user.userappstore.InstalledApp.get(req)
        if (!app.projectid || app.projectid !== req.query.projectid) {
          continue
        }
        found = true
        break
      } else if (install.serverid) {
        req.query.serverid = install.serverid
        const server = await global.api.user.userappstore.ApplicationServer.get(req)
        if (!server.projectid || server.projectid !== req.query.projectid) {
          continue
        }
        found = true
        break
      }
    }
    if (!found) {
      throw new Error('invalid-projectid')
    }
    const files = {
      'app.js': await userAppStore.Storage.read(`project-files/${req.query.projectid}/app.js`),
      'app.css': await userAppStore.Storage.read(`project-files/${req.query.projectid}/app.css`),
      'home.html': await userAppStore.Storage.read(`project-files/${req.query.projectid}/home.html`)
    }
    return files
  }
}
