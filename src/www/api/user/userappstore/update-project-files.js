const userAppStore = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.projectid) {
      throw new Error('invalid-projectid')
    }
    const project = await global.api.user.userappstore.Project.get(req)
    if (!project) {
      throw new Error('invalid-projectid')
    }
    const files = {
      'app.js': await userAppStore.Storage.read(`project-files/${req.query.projectid}/app.js`),
      'app.css': await userAppStore.Storage.read(`project-files/${req.query.projectid}/app.css`),
      'home.html': await userAppStore.Storage.read(`project-files/${req.query.projectid}/home.html`)
    }
    if (req.body['app.js'] && req.body['app.js'] !== files['app.js']) {
      await userAppStore.Storage.write(`project-files/${req.query.projectid}/app.js`, req.body['app.js'])
      files['app.js'] = req.body['app.js']
    }
    if (req.body['app.css'] && req.body['app.css'] !== files['app.css']) {
      await userAppStore.Storage.write(`project-files/${req.query.projectid}/app.css`, req.body['app.css'])
      files['app.css'] = req.body['app.css']
    }
    if (req.body['home.html'] && req.body['home.html'] !== files['home.html']) {
      await userAppStore.Storage.write(`project-files/${req.query.projectid}/home.html`, req.body['home.html'])
      files['home.html'] = req.body['home.html']
    }
    req.success = true
    return files
  }
}
