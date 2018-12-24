const userAppStore = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.projectid) {
      throw new Error('invalid-projectid')
    }
    const project = await global.api.user.userappstore.Project.get(req)
    if (!project) {
      throw new Error('invalid-projectid')
    }
    if (!project.shared) {
      throw new Error('invalid-project')
    }
    project.shared = null
    await userAppStore.Storage.write(`project/${req.query.projectid}`, project)
    req.success = true
    return project
  }
}
