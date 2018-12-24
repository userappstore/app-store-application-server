/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe(`/project-ide`, () => {
  describe('ProjectIDE#BEFORE', () => {
    it('should reject invalid projectid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/project-ide?projectid=invalid`, 'GET')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-projectid')
    })

    it('should bind project to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createProject(user)
      const req = TestHelper.createRequest(`/project-ide?projectid=${user.project.projectid}`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/organizations/organizations?accountid=${user.account.accountid}`]: []
      }
      await req.route.api.before(req)
      assert.strictEqual(req.data.project.projectid, user.project.projectid)
    })
  })

  describe('ProjectIDE#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createProject(user)
      const req = TestHelper.createRequest(`/project-ide?projectid=${user.project.projectid}`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
      }
      return req.route.api.get(req, res)
    })
  })

  describe('ProjectIDE#POST', () => {
    it('should update home.html', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createProject(user)
      const req = TestHelper.createRequest(`/project-ide?projectid=${user.project.projectid}`, 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        'home.html': 'updated',
        'app.js': '',
        'app.css': ''
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        let homeHTML 
        for (const file of req.data.files) {
          if (file.filename === 'home.html') {
            homeHTML = file
            break
          }
        }
        assert.equal(homeHTML.text, req.body['home.html'])
      }
      return req.route.api.post(req, res)
    })

    it('should update app.js', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createProject(user)
      const req = TestHelper.createRequest(`/project-ide?projectid=${user.project.projectid}`, 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        'home.html': '',
        'app.js': 'updated',
        'app.css': ''
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        let appJS
        for (const file of req.data.files) {
          if (file.filename === 'app.js') {
            appJS = file
            break
          }
        }
        assert.equal(appJS.text, req.body['app.js'])
      }
      return req.route.api.post(req, res)
    })

    it('should update app.css', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createProject(user)
      const req = TestHelper.createRequest(`/project-ide?projectid=${user.project.projectid}`, 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        'home.html': '',
        'app.js': '',
        'app.css': 'updated'
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        let appCSS
        for (const file of req.data.files) {
          if (file.filename === 'app.css') {
            appCSS = file
            break
          }
        }
        assert.equal(appCSS.text, req.body['app.css'])
      }
      return req.route.api.post(req, res)
    })
  })
})
