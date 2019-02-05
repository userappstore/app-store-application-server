const dashboardServer = require('../../../../dashboard-server.js')
const userAppStore = require('../../../../../index.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.serverid) {
      throw new Error('invalid-serverid')
    }
    if (!req.body) {
      throw new Error('invalid-profileid')
    }
    const server = await global.api.user.userappstore.ApplicationServer.get(req)
    if (!server) {
      throw new Error('invalid-serverid')
    }
    if (server.configured) {
      throw new Error('invalid-server')
    }
    // only the actual server/project owner can do this
    if (server.ownerid !== req.account.accountid) {
      if (server.projectid) {
        req.query.projectid = server.projectid
        const project = await global.api.user.userappstore.Project.get(req)
        if (project.accountid !== req.account.accountid) {
          throw new Error('invalid-account')
        }
      }
    }
    // new profile
    let profile
    if (!req.body.profileid) {
      if (!req.body.email || !req.body.email.length || !req.body.email.indexOf('@') > 0) {
        throw new Error('invalid-profile-email')
      }
      if (!req.body['first-name'] || !req.body['first-name'].length) {
        throw new Error('invalid-profile-first-name')
      }
      if (global.minimumProfileFirstNameLength > req.body['first-name'].length ||
        global.maximumProfileFirstNameLength < req.body['first-name'].length) {
        throw new Error('invalid-profile-first-name-length')
      }
      if (!req.body['last-name'] || !req.body['last-name'].length) {
        throw new Error('invalid-profile-last-name')
      }
      if (global.minimumProfileLastNameLength > req.body['last-name'].length ||
        global.maximumProfileLastNameLength < req.body['last-name'].length) {
        throw new Error('invalid-profile-last-name-length')
      }
      // users start with a blank default profile that can be updated
      if (!req.body.profileid) {
        req.account = await dashboardServer.get(`/api/user/account?accountid=${req.account.accountid}`, req.account.accountid, req.session.sessionid)
        const defaultProfile = await dashboardServer.get(`/api/user/profile?profileid=${req.account.profileid}`, req.account.accountid, req.session.sessionid)
        if (!defaultProfile.email) {
          await dashboardServer.patch(`/api/application-server/update-default-profile?accountid=${req.account.accountid}`, req.body, req.account.accountid, req.session.sessionid)
          defaultProfile.email = req.body.email
          defaultProfile.firstName = req.body['first-name']
          defaultProfile.lastName = req.body['last-name']
          profile = defaultProfile
        } else {
          profile = await dashboardServer.post(`/api/application-server/create-profile?accountid=${req.account.accountid}`, req.body, req.account.accountid, req.session.sessionid)
        }
      }
    } else {
      req.query = req.query || {}
      req.query.profileid = req.body.profileid
      profile = await dashboardServer.get(`/api/user/profile?profileid=${req.body.profileid}`, req.account.accountid, req.session.sessionid)
    }
    // create the account
    req.body = {
      email: profile.email,
      ['first-name']: profile.firstName,
      ['last-name']: profile.lastName
    }
    const account = await dashboardServer.post(`/api/application-server/create-owner?serverid=${server.serverid}`, req.body, req.account.accountid, req.session.sessionid)
    server.configured = userAppStore.Timestamp.now
    await userAppStore.Storage.write(`server/${req.query.serverid}`, server)
    return account
  }
}