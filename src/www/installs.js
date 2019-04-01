const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  const total = await global.api.user.userappstore.InstallsCount.get(req)
  const installs = await global.api.user.userappstore.Installs.get(req)
  if (installs && installs.length) {
    for (const install of installs) {
      install.created = userAppStore.Timestamp.date(install.created)
    }
  }
  const offset = req.query ? parseInt(req.query.offset, 10) || 0 : 0
  req.data = { installs, total, offset }
}

async function renderPage(req, res) {
  const doc = userAppStore.HTML.parse(req.route.html)
  if (req.data.installs && req.data.installs.length) {
    userAppStore.HTML.renderTable(doc, req.data.installs, 'install-row', 'installs-table')
    for (const install of req.data.installs) {
      if (install.appid) {
        const projectCell = doc.getElementById(`project-${install.installid}`)
        projectCell.parentNode.removeChild(projectCell)
        const urlCell = doc.getElementById(`url-${install.installid}`)
        urlCell.parentNode.removeChild(urlCell)
      } else if (install.projectid) {
        const urlCell = doc.getElementById(`url-${install.installid}`)
        urlCell.parentNode.removeChild(urlCell)
        const appCell = doc.getElementById(`app-${install.installid}`)
        appCell.parentNode.removeChild(appCell)
      } else {
        const projectCell = doc.getElementById(`project-${install.installid}`)
        projectCell.parentNode.removeChild(projectCell)
        const appCell = doc.getElementById(`app-${install.installid}`)
        appCell.parentNode.removeChild(appCell)
      }
    }
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      userAppStore.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noInstalls = doc.getElementById('no-installs')
    noInstalls.parentNode.removeChild(noInstalls)
  } else {
    const installsTable = doc.getElementById('installs-table')
    installsTable.parentNode.removeChild(installsTable)
  }
  return res.end(doc.toString())
}
