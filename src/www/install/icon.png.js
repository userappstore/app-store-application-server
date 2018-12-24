const fs = require('fs')
const path = require('path')
const userAppStore = require('../../../index.js')
let defaultIcon

module.exports = {
  before: beforeRequest,
  get: renderFile
}

async function beforeRequest (req) {
  if (!req.query || !req.query.installid) {
    throw new Error('invalid-installid')
  }
  const install = await global.api.user.userappstore.Install.get(req)
  let icon
  if (!install.icon) {
    if (!defaultIcon) {
      const iconPath = path.join(__dirname, '../public/default-icon.png')
      defaultIcon = fs.readFileSync(iconPath)
    }
    icon = defaultIcon
  } else {
    try {
      icon = await userAppStore.Storage.read('icon/' + install.icon + '.png')
    } catch (error) {
    }
  }
  req.data = { install, icon }
}

function renderFile (req, res) {
  res.statusCode = 200
  res.setHeader('content-type', 'image/png')
  res.setHeader('content-length', req.data.icon.length)
  return res.end(req.data.icon, 'binary')
}
