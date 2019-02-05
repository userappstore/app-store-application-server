module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.projectid) {
      throw new Error('invalid-projectid')
    }
    const project = await global.api.user.userappstore.SharedProject.get(req)
    if (!project) {
      throw new Error('invalid-projectid')
    }
    if (!project.serverid) {
      throw new Error('invalid-project')
    }
    req.query.serverid = project.serverid
    const server = await global.api.user.userappstore.ApplicationServer.get(req)
    return server
  }
}
