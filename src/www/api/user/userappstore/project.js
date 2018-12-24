const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.projectid) {
      throw new Error('invalid-projectid')
    }
    let project = await userAppStore.Storage.read(`project/${req.query.projectid}`)
    if (!project || !project.length) {
      throw new Error('invalid-projectid')
    }
    project = JSON.parse(project)
    if (project.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    return project
  }
}
