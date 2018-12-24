const userAppStore = require('../../../../../index.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    if (!req.body || !req.body.projectid || !req.body.projectid.match(/^[a-zA-Z0-9\-]+$/)) {
      throw new Error('invalid-projectid')
    }
    const projectInfo = {
      object: 'project',
      projectid: req.body.projectid,
      created: userAppStore.Timestamp.now,
      accountid: req.query.accountid
    }
    let exists = await userAppStore.Storage.exists(`project/${req.body.projectid}`)
    if (exists) {
      throw new Error('duplicate-projectid')
    }
    await userAppStore.Storage.write(`project/${req.body.projectid}`, projectInfo)
    await userAppStore.StorageList.add(`account/projects/${req.query.accountid}`, req.body.projectid)
    req.success = true
    return projectInfo
  }
}
