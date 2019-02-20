module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.organizationid) {
      throw new Error('invalid-organizationid')
    }
    const organization = await dashboardServer.get(`/api/user/organizations/organization?organizationid=${req.query.organizationid}`, req.account.accountid, req.session.sessionid)
    if (!organization) {
      throw new Error('invalid-organizationid')
    }
    if (organization.ownerid !== req.account.accountid) {
      const membership = await dashboardServer.get(`/api/user/organizations/organization-membership?organizationid=${req.query.organizationid}`, req.account.accountid, req.session.sessionid)
      if (!membership) {
        throw new Error('invalid-account')
      }
    }
    let projectids
    if (req.query.all) {
      projectids = await userAppStore.StorageList.listAll(`organization/projects/${req.query.organizationid}`)
    } else {
      projectids = await userAppStore.StorageList.list(`organization/projects/${req.query.organizationid}`)
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      projectids = await userAppStore.StorageList.list(`organization/projects/${req.query.organizationid}`, offset)
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