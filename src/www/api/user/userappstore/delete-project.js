const userAppStore = require('../../../../../index.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.projectid) {
      throw new Error('invalid-projectid')
    }
    const project = await global.api.user.userappstore.Project.get(req)
    if (!project) {
      throw new Error('invalid-projectid')
    }
    await userAppStore.Storage.deleteFile(`project/${req.query.projectid}`)
    try {
      await userAppStore.Storage.deleteFile(`project-files/${req.query.projectid}/home.html`)
    } catch (error) {
    }
    try {
      await userAppStore.Storage.deleteFile(`project-files/${req.query.projectid}/app.css`)
    } catch (error) {
    }
    try {
      await userAppStore.Storage.deleteFile(`project-files/${req.query.projectid}/app.js`)
    } catch (error) {
    }
    await userAppStore.StorageList.remove(`account/projects/${req.account.accountid}`, req.query.projectid)
    await userAppStore.StorageList.remove(`projects`, req.query.projectid)
    if (project.serverid) {
      req.query.serverid = project.serverid
      const server = await global.api.user.userappstore.ApplicationServer.get(req)
      if (server.organizationid) {
        await userAppStore.StorageList.remove(`organization/projects/${server.organizationid}`, req.query.projectid)
      }
    }
    req.success = true
  }
}
