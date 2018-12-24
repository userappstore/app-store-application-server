/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/install', () => {
  describe('Install#BEFORE', () => {
    it('should require installid', async () => {
      const req = TestHelper.createRequest('/install?installid=', 'GET')
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-installid')
    })

    it('should reject other account\'s install', async () => {
      const user1 = await TestHelper.createUser()
      const install = await TestHelper.createInstall(user1)
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/install?installid=${install.installid}`, 'GET')
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
      const req = TestHelper.createRequest(`/install?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.install.installid, user.install.installid)
    })
  })

  describe('Install#GET', () => {
    it('should present the install table', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createInstall(user)
      const req = TestHelper.createRequest(`/install?installid=${user.install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('installs-table')
        const tbody = table.getElementById(user.install.installid)
        assert.strictEqual(tbody.tag, 'tbody')
      }
      return req.route.api.get(req, res)
    })
  })
})
