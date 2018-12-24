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
    req.success = true
  }
}
