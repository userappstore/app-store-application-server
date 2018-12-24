const userAppStore = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.projectid) {
      throw new Error('invalid-projectid')
    }
    const project = await global.api.user.userappstore.Project.get(req)
    if (!project) {
      throw new Error('invalid-projectid')
    }
    const files = {}
    try {
      files['app.js'] = await userAppStore.Storage.read(`project-files/${req.query.projectid}/app.js`)
    } catch (error) {
      files['app.js'] = ''
    }
    try {
      files['app.css'] = await userAppStore.Storage.read(`project-files/${req.query.projectid}/app.css`)
    } catch (error) {
      files['app.css'] = ''
    }
    try {
      files['home.html'] = await userAppStore.Storage.read(`project-files/${req.query.projectid}/home.html`)
    } catch (error) {
      files['home.html'] = ''
    }
    return files
  }
}
