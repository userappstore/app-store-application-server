const userAppStore = require('../../../../../index.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.projectid) {
      throw new Error('invalid-projectid')
    }
    if (!req.body || !req.body.projectid || !req.body.projectid.match(/^[a-zA-Z0-9\-]+$/)) {
      throw new Error('invalid-projectid')
    }
    const sharedProject = await global.api.user.userappstore.SharedProject.get(req)
    if (!sharedProject) {
      throw new Error('invalid-projectid')
    }
    const projectReq = { 
      account: req.account,
      query: { 
        accountid: req.account.accountid 
      }, 
      body: {
        projectid: req.body.projectid,
        created: userAppStore.Timestamp.now
      }
    }
    const project = await global.api.user.userappstore.CreateProject._post(projectReq)
    req.body = {
      'app.js': await userAppStore.Storage.read(`project-files/${req.query.projectid}/app.js`),
      'app.css': await userAppStore.Storage.read(`project-files/${req.query.projectid}/app.css`),
      'home.html': await userAppStore.Storage.read(`project-files/${req.query.projectid}/home.html`)
    }
    await global.api.user.userappstore.UpdateProjectFiles.patch(req)
    req.success = true
    return project
  }
}
