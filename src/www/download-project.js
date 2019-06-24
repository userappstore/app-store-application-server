const navbar = require('./navbar-project.js')
const exec = require('child_process').exec
const fs = require('fs')
const os = require('os')
const path = require('path')
const userAppStore = require('../../index.js')
const util = require('util')
const asyncExec = util.promisify(exec)

const files = [
  'readme.md',
  'application-server/main.js',
  'application-server/package.json',
  'application-server/start.sh',
  'application-server/src/bcrypt.js',
  'application-server/src/www/index.html',
  'application-server/src/www/whois.js.js',
  'dashboard-server/main.js',
  'dashboard-server/package.json',
  'dashboard-server/start.sh'
]
let fileCache = {}

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
  navbar.setup(doc, req)
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
  } else {
    userAppStore.HTML.renderTemplate(doc, null, 'download-note-template', 'message-container')
  }
  return res.end(doc.toString())
}

async function submitForm (req, res) {
  // write the project files with supplemental files to make it standalone
  for (const file of files) {
    fileCache[file] = fileCache[file] || fs.readFileSync(path.join(__dirname, `../project-standalone/${file}`)).toString('utf-8')
  }
  const tempDir = os.tmpdir()
  const timestamp = Math.floor(new Date().getTime() / 1000)
  const timestampedName = `${req.data.project.projectid}-${timestamp}`
  const zipFileName = `${timestampedName}.zip`
  const projectPath = `${tempDir}/${timestampedName}`
  fs.mkdirSync(projectPath)
  fs.mkdirSync(`${projectPath}/application-server`)
  fs.mkdirSync(`${projectPath}/application-server/src`)
  fs.mkdirSync(`${projectPath}/application-server/src/www`)
  fs.mkdirSync(`${projectPath}/application-server/src/www/public`)
  fs.mkdirSync(`${projectPath}/dashboard-server`)
  fs.mkdirSync(`${projectPath}/src/www/public`)
  for (const file of files) {
    fs.writeFileSync(`${projectPath}/${file}`, fileCache[file], 'utf-8')  
  }
  fs.writeFileSync(`${projectPath}/application-server/src/www/home.html`, req.data.files['home.html'] || '', 'utf-8')
  fs.writeFileSync(`${projectPath}/application-server/src/www/public/app.css`, req.data.files['app.css'] || '', 'utf-8')
  fs.writeFileSync(`${projectPath}/application-server/src/www/public/app.js`, req.data.files['app.js'] || '', 'utf-8')
  await asyncExec(`cd ${tempDir}; zip -r ${zipFileName} ${timestampedName}`)
  const buffer = fs.readFileSync(`${tempDir}/${zipFileName}`)
  // cleanup
  for (const file of files) {
    fs.unlinkSync(`${projectPath}/${file}`)
  } 
  fs.unlinkSync(`${projectPath}/application-server`)
  fs.unlinkSync(`${projectPath}/application-server/src`)
  fs.unlinkSync(`${projectPath}/application-server/src/www`)
  fs.unlinkSync(`${projectPath}/application-server/src/www/public`)
  fs.unlinkSync(`${projectPath}/dashboard-server`)
  fs.unlinkSync(`${projectPath}/src/www/public`)
  fs.unlinkSync(`${tempDir}/${zipFileName}`)
  fs.rmdirSync(projectPath)
  res.setHeader('content-disposition', `attachment; filename="${zipFileName}"`)
  res.setHeader('content-type', 'application/octet-stream')
  res.setHeader('content-length', buffer.length)
  res.statusCode = 200
  return res.end(buffer)
}
