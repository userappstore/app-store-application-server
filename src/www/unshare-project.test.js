/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/unshare-project', () => {
  describe('UnshareProject#BEFORE', () => {
    it('should require projectid', async () => {
      const req = TestHelper.createRequest('/unshare-project?projectid=', 'GET')
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-projectid')
    })

    it('should require own projectid', async () => {
      const user1 = await TestHelper.createUser()
      const project1 = await TestHelper.createProject(user1)
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/unshare-project?projectid=${project1.projectid}`, 'GET')
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

    it('should reject unshared project', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user)
      const req = TestHelper.createRequest(`/unshare-project?projectid=${project.projectid}`, 'GET')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-project')
    })

    it('should bind project to req', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user, { shared: true })
      const req = TestHelper.createRequest(`/unshare-project?projectid=${project.projectid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.project.projectid, project.projectid)
    })
  })

  describe('UnshareProject#GET', () => {
    it('should present the form', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user, { shared: true })
      const req = TestHelper.createRequest(`/unshare-project?projectid=${project.projectid}`, 'GET')
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

  describe('UnshareProject#POST', () => {
    it('should apply after authorization', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user, { shared: true })
      const req = TestHelper.createRequest(`/unshare-project?projectid=${project.projectid}`, 'POST')
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
