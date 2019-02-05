const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    let projectids
    if (req.query.all) {
      projectids = await userAppStore.StorageList.listAll(`account/projects/${req.query.accountid}`)
    } else {projectids = await userAppStore.StorageList.list(`account/projects/${req.query.accountid}`)
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      projectids = await userAppStore.StorageList.list(`account/projects/${req.query.accountid}`, offset)
    }
    if (!projectids || !projectids.length) {
      return null
    }
    const query = req.query
    req.query = {}
    const projects = []
    for (const projectid of projectids) {
      req.query.projectid = projectid
      const project = await global.api.user.userappstore.Project.get(req)
      projects.push(project)
    }
    req.query = query
    return projects
  }
}
