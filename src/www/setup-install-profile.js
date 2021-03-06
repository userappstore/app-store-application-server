const dashboardServer = require('../dashboard-server.js')
const userAppStore = require('../../index.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest(req) {
  if (!req.query || !req.query.installid) {
    throw new Error('invalid-installid')
  }
  const install = await global.api.user.userappstore.Install.get(req)
  if (!install) {
    throw new Error('invalid-installid')
  }
  // expand the full account object to get the default profile
  req.account = await dashboardServer.get(`/api/user/account?accountid=${req.account.accountid}`, req.account.accountid, req.session.sessionid)
  const profiles = await dashboardServer.get(`/api/user/profiles?accountid=${req.account.accountid}`, req.account.accountid, req.session.sessionid)
  let eligible = []
  if (profiles && profiles.length) {
    for (const profile of profiles) {
      if (profile.email) {
        eligible.push(profile)
      }
    }
  }
  req.data = { profiles: eligible, allProfiles: profiles, install }
}

async function renderPage(req, res, messageTemplate) {
  const doc = userAppStore.HTML.parse(req.route.html, req.data.install, 'install')
  if (messageTemplate) {
    userAppStore.HTML.renderTemplate(doc, req.data.project, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return res.end(doc.toString())
    }
  }
  if (req.data.profiles && req.data.profiles.length) {
    userAppStore.HTML.renderList(doc, req.data.profiles, 'profile-option', 'profileid')
  } else {
    const existingProfile = doc.getElementById('existing-profile')
    existingProfile.parentNode.removeChild(existingProfile)
  }
  return res.end(doc.toString())
}

async function submitForm(req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  // new profile
  if (!req.body.profileid) {
    if (!req.body.email || !req.body.email.length || !req.body.email.indexOf('@') > 0) {
      return renderPage(req, res, 'invalid-profile-email')
    }
    if (!req.body['first-name'] || !req.body['first-name'].length) {
      return renderPage(req, res, 'invalid-profile-first-name')
    }
    if (global.minimumProfileFirstNameLength > req.body['first-name'].length ||
      global.maximumProfileFirstNameLength < req.body['first-name'].length) {
      return renderPage(req, res, 'invalid-profile-first-name-length')
    }
    if (!req.body['last-name'] || !req.body['last-name'].length) {
      return renderPage(req, res, 'invalid-profile-last-name')
    }
    if (global.minimumProfileLastNameLength > req.body['last-name'].length ||
      global.maximumProfileLastNameLength < req.body['last-name'].length) {
      return renderPage(req, res, 'invalid-profile-last-name-length')
    }
    // users start with a blank default profile that can be updated
    let defaultProfile
    if (req.data.allProfiles && req.data.allProfiles.length) {
      for (const profile of req.data.allProfiles) {
        defaultProfile = profile.profileid === req.account.profileid ? profile : undefined
        if (defaultProfile) {
          break
        }
      }
      let profile
      if (!defaultProfile.email) {
        await dashboardServer.patch(`/api/user/update-profile?profileid=${req.account.profileid}`, req.body, req.account.accountid, req.session.sessionid)
        defaultProfile.email = req.body.email
        defaultProfile.firstName = req.body['first-name']
        defaultProfile.lastName = req.body['last-name']
        profile = defaultProfile
      } else {
        profile = await dashboardServer.post(`/api/user/create-profile?accountid=${req.account.accountid}`, req.body, req.account.accountid, req.session.sessionid)
      }
      req.body.profileid = profile.profileid
    }
  } else {
    if (!req.data.profiles || !req.data.profiles.length) {
      return renderPage(req, res, 'invalid-profileid')
    }
    for (const item of req.data.profiles) {
      profile = item.profileid === req.body.profileid ? item : false
      if (profile) {
        break
      }
    }
    if (!profile) {
      return renderPage(req, res, 'invalid-profileid')
    }
    req.body.profileid = profile.profileid
  }
  try {
    req.query.accountid = req.account.accountid
    req.body.appid = req.query.appid
    await global.api.user.userappstore.CreateInstallAccount.post(req)
    res.statusCode = 302
    res.setHeader('location', `/install/${req.data.install.installid}/home`)
    return res.end()
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
