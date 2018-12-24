/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/import-project', () => {
  describe('ImportProject#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/import-project`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
        assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      }
      return req.route.api.get(req, res)
    })
  })

  describe('ImportProject#POST', () => {
    it('should reject unshared projectid', async () => {
      const user1 = await TestHelper.createUser()
      const project = await TestHelper.createProject(user1)
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/import-project`, 'GET')
      req.account = user2.account
      req.session = user2.session
      req.body = {
        projectid: project.projectid,
        text: 'the link'
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'invalid-project')
      }
      return req.route.api.post(req, res)
    })

    it('should reject invalid text', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user)
      const req = TestHelper.createRequest(`/import-project`, 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        projectid: project.projectid,
        text: null
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'invalid-text')
      }
      return req.route.api.post(req, res)
    })

    it('should create install from project', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user, { shared: true })
      const req = TestHelper.createRequest(`/import-project?projectid=${project.projectid}`, 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        projectid: project.projectid,
        text: 'the link'
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'success')
      }
      return req.route.api.post(req, res)
    })
  })
})
