/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/create-collection', () => {
  describe('CreateCollection#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/create-collection', 'GET')
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

  describe('CreateCollection#POST', () => {
    it('should reject invalid name', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.wait()
      const project = await TestHelper.createProject(user)
      const req = TestHelper.createRequest('/create-collection', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        name: null,
        stripeid: '4'
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const message = doc.getElementById('message-container').child[0]
        assert.strictEqual(message.attr.template, 'invalid-name')
      }
      return req.route.api.post(req, res)
    })

    it('should reject invalid CSS text color', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/create-collection', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        name: 'The name',
        text: 'something',
        background: '#CCC'
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const message = doc.getElementById('message-container').child[0]
        assert.strictEqual(message.attr.template, 'invalid-text')
      }
      return req.route.api.post(req, res)
    })

    it('should reject invalid CSS background color', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/create-collection', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        name: 'The name',
        text: '#CCC',
        background: null
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const message = doc.getElementById('message-container').child[0]
        assert.strictEqual(message.attr.template, 'invalid-background')
      }
      return req.route.api.post(req, res)
    })

    it('should create after authorization', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/create-collection', 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        name: 'The name',
        text: '#CCC',
        background: '#000'
      }
      const res = TestHelper.createResponse()
      res.end = async () => {
        assert.equal(req.success, true)
      }
      return req.route.api.post(req, res)
    })
  })
})
