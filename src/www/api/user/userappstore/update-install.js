const dashboardServer = require('../../../../dashboard-server.js')
const userAppStore = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.installid) {
      throw new Error('invalid-installid')
    }
    const install = await global.api.user.userappstore.Install.get(req)
    if (req.body.text && req.body.text.length) {
      install.text = req.body.text
    } else if (!install.text) {
      throw new Error('invalid-text')
    }
    if (req.body.collectionid) {
      // add the link to a collection
      req.query.collectionid = req.body.collectionid
      req.body.installid = install.installid
      await global.api.user.userappstore.AddCollectionItem.post(req)
      if (install.collectionid && install.collectionid !== req.body.collectionid) {
        // changed collection
        req.query.collectionid = install.collectionid
        req.body.installid = req.query.installid
        await global.api.user.userappstore.DeleteCollectionItem.delete(req)
      }
    } else if (install.collectionid) {
      // remove from previous
      install.collectionid = ''
      req.query.collectionid = install.collectionid
      req.body.installid = req.query.installid
      await global.api.user.userappstore.DeleteCollectionItem.delete(req)
    }
    // organization members
    if (install.organizationid) {
      const memberships = await dashboardServer.get(`/api/user/organizations/organization-memberships?organizationid=${install.organizationid}`, req.account.accountid, req.session.sessionid)
      if (!memberships || !memberships.length) {
        install.subscriptions = ''
      }
      for (const field in req.body) {
        if (!field.startsWith('member-')) {
          continue
        }
        const membershipid = field.split('-')[1]
        let found = false
        for (const membership of memberships) {
          found = membership.membershipid === membershipid
          if (found) {
            break
          }
        }
        if (!found) {
          throw new Error('invalid-membershipid')
        }
        install.subscriptions = install.subscriptions || []
        install.subscriptions.push(membershipid)
      }
    }
    await userAppStore.Storage.write(`install/${req.query.installid}`, install)
    req.success = true
    return install
  }
}
