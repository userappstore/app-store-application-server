/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/copy-project', () => {
  describe('CopyProject#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/copy-project', 'GET')
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

  describe('CopyProject#POST', () => {
    it('should require shared project id', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/copy-project', 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        sharedid: null,
        projectid: 'nothing'
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'invalid-sharedid')
      }
      return req.route.api.post(req, res)
    })

    it('should require copy project id', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/copy-project', 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        sharedid: 'nothing',
        projectid: null
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'invalid-projectid')
      }
      return req.route.api.post(req, res)
    })

    it('should require shared project', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user)
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/copy-project`, 'GET')
      req.account = user2.account
      req.session = user2.session
      req.body = {
        sharedid: project.projectid,
        projectid: 'something'
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

    it('should reject invalid projectid', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user, { shared: true })
      const req = TestHelper.createRequest('/copy-project', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        sharedid: project.projectid,
        projectid: '$sdfg'
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const message = doc.getElementById('message-container').child[0]
        assert.strictEqual(message.attr.template, 'invalid-projectid')
      }
      return req.route.api.post(req, res)
    })

    it('should reject duplicate projectid', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user, { shared: true })
      const project2 = await TestHelper.createProject(user)
      const req = TestHelper.createRequest('/copy-project', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        sharedid: project.projectid,
        projectid: project2.projectid
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const message = doc.getElementById('message-container').child[0]
        assert.strictEqual(message.attr.template, 'duplicate-projectid')
      }
      return req.route.api.post(req, res)
    })

    it('should apply after authorization', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user, { shared: true })
      const req = TestHelper.createRequest(`/copy-project`, 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        sharedid: project.projectid,
        projectid: 'new-project-id'
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
