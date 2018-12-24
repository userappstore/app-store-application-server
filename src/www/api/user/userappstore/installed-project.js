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
      if (install.projectid !== req.query.projectid) {
        continue
      }
      found = true
      break
    }
    if (!found) {
      throw new Error('invalid-projectid')
    }
    let project = await userAppStore.Storage.read(`project/${req.query.projectid}`)
    if (!project || !project.length) {
      throw new Error('invalid-projectid')
    }
    project = JSON.parse(project)
    return project
  }
}
