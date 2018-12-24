/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe(`/edit-install`, () => {
  describe('EditInstall#BEFORE', () => {
    it('should reject invalid installid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/edit-install?installid=invalid`, 'GET')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-installid')
    })

    it('should bind install to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createInstall(user)
      const req = TestHelper.createRequest(`/edit-install?installid=${user.install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/organizations/organizations?accountid=${user.account.accountid}`]: []
      }
      await req.route.api.before(req)
      assert.strictEqual(req.data.install.installid, user.install.installid)
    })
  })

  describe('EditInstall#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createInstall(user)
      const req = TestHelper.createRequest(`/edit-install?installid=${user.install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/organizations/organizations?accountid=${user.account.accountid}`]: []
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
        assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      }
      return req.route.api.get(req, res)
    })
  })

  describe('EditInstall#POST', () => {
    it('should reject invalid text', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createInstall(user)
      const req = TestHelper.createRequest(`/edit-install?installid=${user.install.installid}`, 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
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

    it('should reject invalid collection', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createInstall(user)
      const req = TestHelper.createRequest(`/edit-install?installid=${user.install.installid}`, 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        text: 'the text',
        collectionid: 'invalid'
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'invalid-collectionid')
      }
      return req.route.api.post(req, res)
    })

    it('should update after authorization', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createInstall(user)
      const req = TestHelper.createRequest(`/edit-install?installid=${user.install.installid}`, 'POST')
      req.account = user.account
      req.session = user.session
      req.body = {
        name: 'the text',
        text: '#FFF',
        background: '#000'
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
