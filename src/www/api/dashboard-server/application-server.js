const userAppStore = require('../../../../index.js')

module.exports = {
  auth: false,
  get: async (req) => {
    if (!req.dashboardServer) {
      return
    }
    if (!req.query || !req.query.serverid) {
      throw new Error('invalid-application-serverid')
    }
    let server = await userAppStore.Storage.read(`server/${req.query.serverid}`)
    if (!server || !server.length) {
      throw new Error('invalid-application-serverid')
    }
    server = JSON.parse(server)
    if (!server || server.object !== 'server') {
      throw new Error('invalid-application-serverid')
    }
    if (server.projectid) {
      let project = await userAppStore.Storage.read(`project/${server.projectid}`)
      if (!project || !project.length) {
        throw new Error('invalid-projectid')
      }
      project = JSON.parse(project)
      if (!project.serverid) {
        throw new Error('invalid-project')
      }
      server.project = project
    }
    return server
  }
}
