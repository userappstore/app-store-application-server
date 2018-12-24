const bcrypt = require('bcrypt-node')
const exec = require('child_process').exec
const fs = require('fs')
const os = require('os')
const path = require('path')
const userAppStore = require('../../index.js')
const util = require('util')
const asyncExec = util.promisify(exec)

let nodePackageJSON, nodeMainJS, nodeReadMe, nodeIndexHTML

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.projectid) {
    throw new Error('invalid-projectid')
  }
  const project = await global.api.user.userappstore.Project.get(req)
  if (project.accountid !== req.account.accountid) {
    throw new Error('invalid-account')
  }
  const files = await global.api.user.userappstore.ProjectFiles.get(req)
  if (files['app.html'] === null) {
    files['app.html'] = ''
  }
  if (files['app.css'] === null) {
    files['app.css'] = ''
  }
  if (files['app.js'] === null) {
    files['app.js'] = ''
  }
  req.data = { files, project }
}

function renderPage (req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.project, 'project')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
  } else {
    userAppStore.HTML.renderTemplate(doc, null, 'download-note-template', 'message-container')
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  // node project config
  const salt = bcrypt.genSaltSync(1)
  const uuidEncoding = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split().sort((a, b) => {
    return Math.random() < 0.5 ? 1 : -1
  })
  const uuidSeed = 1000000 + Math.floor(Math.random() * 1000000)
  const uuidIncrement = Math.ceil(Math.random() * 1000)
  const dotEnv = `NODE_ENV=development
BCRYPT_WORK_FACTOR=1
PORT=9573
BCRYPT_FIXED_SALT=${salt}
UUID_ENCODING_CHARACTERS=${uuidEncoding}
UUID_SEED=${uuidSeed}
UUID_INCREMENT=${uuidIncrement}`
  // write the project files with supplemental files to make it standalone
  nodePackageJSON = nodePackageJSON || fs.readFileSync(path.join(__dirname, '../project-standalone/package.json')).toString('utf-8')
  nodeMainJS = nodeMainJS || fs.readFileSync(path.join(__dirname, '../project-standalone/main.js')).toString('utf-8')
  nodeReadMe = nodeReadMe || fs.readFileSync(path.join(__dirname, '../project-standalone/readme.md')).toString('utf-8')
  nodeIndexHTML = nodeIndexHTML || fs.readFileSync(path.join(__dirname, '../project-standalone/index.html')).toString('utf-8')
  const tempDir = os.tmpdir()
  const timestamp = Math.floor(new Date().getTime() / 1000)
  const timestampedName = `${req.data.project.projectid}-${timestamp}`
  const zipFileName = `${timestampedName}.zip`
  const projectPath = `${tempDir}/${timestampedName}`
  fs.mkdirSync(projectPath)
  fs.mkdirSync(`${projectPath}/src`)
  fs.mkdirSync(`${projectPath}/src/www`)
  fs.mkdirSync(`${projectPath}/src/www/public`)
  fs.writeFileSync(`${projectPath}/.env`, dotEnv, 'utf-8')
  fs.writeFileSync(`${projectPath}/main.js`, nodeMainJS, 'utf-8')
  fs.writeFileSync(`${projectPath}/package.json`, nodePackageJSON, 'utf-8')
  fs.writeFileSync(`${projectPath}/readme.md`, nodeReadMe, 'utf-8')
  fs.writeFileSync(`${projectPath}/src/www/index.html`, nodeIndexHTML, 'utf-8')
  fs.writeFileSync(`${projectPath}/src/www/home.html`, req.data.files['home.html'] || '', 'utf-8')
  fs.writeFileSync(`${projectPath}/src/www/public/app.css`, req.data.files['app.css'] || '', 'utf-8')
  fs.writeFileSync(`${projectPath}/src/www/public/app.js`, req.data.files['app.js'] || '', 'utf-8')
  await asyncExec(`cd ${tempDir}; zip -r ${zipFileName} ${timestampedName}`)
  const buffer = fs.readFileSync(`${tempDir}/${zipFileName}`)
  fs.unlinkSync(`${tempDir}/${zipFileName}`)
  fs.unlinkSync(`${projectPath}/.env`)
  fs.unlinkSync(`${projectPath}/main.js`)
  fs.unlinkSync(`${projectPath}/package.json`)
  fs.unlinkSync(`${projectPath}/readme.md`)
  fs.unlinkSync(`${projectPath}/src/www/home.html`)
  fs.unlinkSync(`${projectPath}/src/www/public/app.js`)
  fs.unlinkSync(`${projectPath}/src/www/public/app.css`)
  fs.unlinkSync(`${projectPath}/src/www/index.html`)
  fs.rmdirSync(`${projectPath}/src/www/public`)
  fs.rmdirSync(`${projectPath}/src/www`)
  fs.rmdirSync(`${projectPath}/src`)
  fs.rmdirSync(projectPath)
  res.setHeader('content-disposition', `attachment; filename="${zipFileName}"`)
  res.setHeader('content-type', 'application/octet-stream')
  res.setHeader('content-length', buffer.length)
  res.statusCode = 200
  return res.end(buffer)
}
