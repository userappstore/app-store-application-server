/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/create-project', () => {
  describe('CreateProject#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/create-project', 'GET')
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

  describe('CreateProject#POST', () => {
    it('should reject invalid projectid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/create-project', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        projectid: '#af'
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
      const project = await TestHelper.createProject(user)
      const req = TestHelper.createRequest('/create-project', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        projectid: project.projectid
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const message = doc.getElementById('message-container').child[0]
        assert.strictEqual(message.attr.template, 'duplicate-projectid')
      }
      return req.route.api.post(req, res)
    })

    it('should create after authorization', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/create-project', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        projectid: 'this-is-it'
      }
      const res = TestHelper.createResponse()
      res.end = async () => {
        assert.equal(req.success, true)
      }
      return req.route.api.post(req, res)
    })
  })
})
