/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/delete-install', () => {
  describe('DeleteInstall#BEFORE', () => {
    it('should require installid', async () => {
      const req = TestHelper.createRequest('/delete-install?installid=', 'GET')
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-installid')
    })

    it('should require own installid', async () => {
      const user1 = await TestHelper.createUser()
      const install1 = await TestHelper.createInstall(user1)
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/delete-install?installid=${install1.installid}`, 'GET')
      req.account = user2.account
      req.session = user2.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('should bind install to req', async () => {
      const user = await TestHelper.createUser()
      const install = await TestHelper.createInstall(user)
      const req = TestHelper.createRequest(`/delete-install?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.install.installid, install.installid)
    })
  })

  describe('DeleteInstall#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      const install = await TestHelper.createInstall(user)
      const req = TestHelper.createRequest(`/delete-install?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        assert.strictEqual(doc.getElementById('submit-form').tag, 'form')
        assert.strictEqual(doc.getElementById('submit-button').tag, 'button')
      }
      await req.route.api.before(req)
      return req.route.api.get(req, res)
    })
  })

  describe('DeleteInstall#POST', () => {
    it('should installly after authorization', async () => {
      const user = await TestHelper.createUser()
      const install = await TestHelper.createInstall(user)
      const req = TestHelper.createRequest(`/delete-install?installid=${install.installid}`, 'POST')
      req.account = user.account
      req.session = user.session
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
