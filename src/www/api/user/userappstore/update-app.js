const Calipers = require('calipers')('png', 'jpeg')
const fs = require('fs')
const Multiparty = require('multiparty')
const userAppStore = require('../../../../../index.js')
const util = require('util')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.appid) {
      throw new Error('invalid-appid')
    }
    await parseMultiPartData(req)
    if (!req.body || !req.body.name || !req.body.name.length) {
      throw new Error('invalid-name')
    }
    if (!req.body.description || !req.body.description.length) {
      throw new Error('invalid-description')
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
      app.icon = req.icon
    }
    req.screenshots = req.screenshots || []
    for (let i = 0; i < 4; i++) {
      app.screenshots[i] = req.screenshots[i] || app.screenshots[i]
    }
    await userAppStore.Storage.write(`app/${req.query.appid}`, app)
    req.success = true
    return app
  }
}

const parseMultiPartData = util.promisify((req, callback) => {
  const form = new Multiparty.Form()
  return form.parse(req, async (error, fields, files) => {
    if (error) {
      return callback(error)
    }
    
    req.body = {}
    req.icon = null
    req.screenshots = []
    for (const field in fields) {
      req.body[field] = fields[field][0]
    }
    if (!files) {
      return callback()
    }
    for (const file in files) {
      if (!files[file] || !files[file].length || !files[file][0].size) {
        continue
      }
      const extension = files[file][0].originalFilename.toLowerCase().split('.').pop()
      if (extension !== 'png' && extension !== 'jpg' && extension !== 'jpeg') {
        throw new Error('invalid-upload')
      }
      const image = await Calipers.measure(files[file][0].path)
      if (file === 'icon') {
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
        req.screenshots.push(true)
      }
      const buffer = fs.readFileSync(files[file][0].path)
      const uploadName = `assets/${req.query.appid}/${file}.` + (file === 'icon' ? 'png' : 'jpg')
      await userAppStore.Storage.writeImage(uploadName, buffer)
    }
    if (error) {
      throw new Error(error)
    }
    await deleteUploads(files)
    return callback()
  })
})

async function deleteUploads (files) {
  for (const file in files) {
    if (!files[file] || !files[file].length) {
      continue
    }
    for (const upload of files[file]) {
      if (fs.existsSync(upload.path)) {
        fs.unlinkSync(upload.path)
      }
    }
  }
}
