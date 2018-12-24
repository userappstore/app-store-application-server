/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/import-url', () => {
  describe('ImportURL#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/import-url`, 'GET')
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

  describe('ImportURL#POST', () => {
    it('should reject invalid URL', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/import-url`, 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        url: null,
        text: 'the text'
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'invalid-url')
      }
      return req.route.api.post(req, res)
    })

    it('should reject non-HTTPS URLs', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/import-url`, 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        url: 'http://something/',
        text: 'the text'
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'invalid-url')
      }
      return req.route.api.post(req, res)
    })

    it('should reject invalid text', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/import-url`, 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        url: 'https://something/',
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

    it('should create install from URL', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/import-url`, 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        url: 'https://something',
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
