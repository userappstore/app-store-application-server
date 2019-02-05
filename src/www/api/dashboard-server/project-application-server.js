const userAppStore = require('../../../../index.js')

module.exports = {
  auth: false,
  get: async (req) => {
    if (!req.dashboardServer) {
      return
    }
    if (!req.query || !req.query.projectid) {
      throw new Error('invalid-projectid')
    }
    let project = await userAppStore.Storage.read(`project/${req.query.projectid}`)
    if (!project || !project.length) {
      throw new Error('invalid-projectid')
    }
    project = JSON.parse(project)
    if (!project.serverid) {
      throw new Error('invalid-project')
    }
    let server = await userAppStore.Storage.read(`server/${project.serverid}`)
    if (!server || !server.length) {
      throw new Error('invalid-application-serverid')
    }
    server = JSON.parse(server)
    return server
  }
}
