const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!global.sampleProjectOrganization) {
      return null
    }
    let projectids
    if (req.query.all) {
      projectids = await userAppStore.StorageList.listAll(`organization/projects/${global.sampleProjectOrganization}`)
    } else {
      projectids = await userAppStore.StorageList.list(`organization/projects/${global.sampleProjectOrganization}`)
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      projectids = await userAppStore.StorageList.list(`organization/projects/${global.sampleProjectOrganization}`, offset)
    }
    if (!projectids || !projectids.length) {
      return null
    }
    const projects = []
    for (const projectid of projectids) {
      req.query.projectid = projectid
      const project = await global.api.user.userappstore.SharedProject.get(req)
      projects.push(project)
    }
    return projects
  }
}