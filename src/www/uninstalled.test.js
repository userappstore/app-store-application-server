/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/uninstalled', () => {
  describe('Uninstalled#BEFORE', () => {
    it('should bind uninstalled to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createInstall(user)
      await TestHelper.wait()
      const uninstall = await TestHelper.deleteInstall(user, user.install.installid)
      await TestHelper.wait()
      const req = TestHelper.createRequest(`/uninstalled`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.uninstalls[0].uninstallid, uninstall.uninstallid)
    })
  })

  describe('Uninstalled#GET', () => {
    it('should limit uninstalled to one page', async () => {
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createInstall(user)
        await TestHelper.wait()
        await TestHelper.deleteInstall(user, user.install.installid)
        await TestHelper.wait()
      }
      const req = TestHelper.createRequest('/uninstalled', 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('uninstalls-table')
        const rows = table.getElementsByTagName('tr')
        assert.strictEqual(rows.length, global.pageSize + 1)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce page size', async () => {
      global.pageSize = 3
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createInstall(user)
        await TestHelper.wait()
        await TestHelper.deleteInstall(user, user.install.installid)
        await TestHelper.wait()
      }
      const req = TestHelper.createRequest('/uninstalled', 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('uninstalls-table')
        const rows = table.getElementsByTagName('tr')
        assert.strictEqual(rows.length, global.pageSize + 1)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce specified offset', async () => {
      const offset = 1
      const user = await TestHelper.createUser()
      const uninstalled = []
      for (let i = 0, len = offset + global.pageSize + 1; i < len; i++) {
        const install = await TestHelper.createInstall(user)
        await TestHelper.wait()
        const uninstall = await TestHelper.deleteInstall(user, install.installid)
        await TestHelper.wait()
        uninstalled.unshift(uninstall)
      }
      const req = TestHelper.createRequest(`/uninstalled?offset=${offset}`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        for (let i = 0, len = global.pageSize; i < len; i++) {
          assert.strictEqual(doc.getElementById(uninstalled[offset + i].uninstallid).tag, 'tr')
        }
      }
      return req.route.api.get(req, res)
    })
  })
})
