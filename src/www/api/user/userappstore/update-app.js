const Calipers = require('calipers')('png', 'jpeg')
const fs = require('fs')
const userAppStore = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.appid) {
      throw new Error('invalid-appid')
    }
    if (!req.body || !req.body.name || !req.body.name.length) {
      throw new Error('invalid-name')
    }
    if (!req.body.description || !req.body.description.length) {
      throw new Error('invalid-description')
    }
    if (req.uploads) {
      req.screenshots = []
      for (const filename in req.uploads) {
        const filePath = '/tmp/' + userAppStore.UUID.random(32) + req.uploads[filename].name
        fs.writeFileSync(filePath, req.uploads[filename].buffer)
        const image = await Calipers.measure(filePath)
        fs.unlinkSync(filePath)
        if (filename === 'icon.png') {
          if (image.type !== 'png' || image.pages[0].width !== 512 || image.pages[0].height !== 512) {
            error = 'invalid-icon'
            break
          }
          req.icon = true
        } else {
          if (image.type !== 'jpeg' || image.pages[0].width !== 1920 || image.pages[0].height !== 1080) {
            error = 'invalid-screenshot'
            break
          }
          let index = filename.substring('screenshot'.length)
          index = index.substring(0, index.indexOf('.'))
          index = parseInt(index, 10) - 1
          req.screenshots[index] = true
        }
      }
    }
    const app = await global.api.user.userappstore.App.get(req)
    if (!app) {
      throw new Error('invalid-appid')
    }
    if (app.unpublished) {
      throw new Error('invalid-app')
    }
    app.name = req.body.name
    app.description = req.body.description
    app.tags = []
    app.screenshots = app.screenshots || []
    for (let i = 1; i < 5; i++) {
      const tag = req.body[`tag${i}`]
      if (!tag || !tag.length) {
        continue
      }
      app.tags.push(tag)
    }
    if (req.icon) {
      app.icon = true
      await userAppStore.Storage.writeImage(`assets/${app.appid}/icon.png`, req.uploads['icon.png'].buffer)
    }
    for (let i = 0; i < 4; i++) {
      if (req.screenshots.length > i && req.screenshots[i]) {
        await userAppStore.Storage.writeImage(`assets/${app.appid}/screenshot${i + 1}.jpg`, req.uploads[`screenshot${i + 1}.jpg`].buffer)
        app.screenshots[i] = true
      }
    }
    await userAppStore.Storage.write(`app/${req.query.appid}`, app)
    req.success = true
    return app
  }
}
