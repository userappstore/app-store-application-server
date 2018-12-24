/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/installs', () => {
  describe('Installs#BEFORE', () => {
    it('should bind installs to req', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createInstall(user)
      await TestHelper.wait()
      const req = TestHelper.createRequest(`/installs`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.installs[0].installid, user.install.installid)
    })
  })

  describe('Installs#GET', () => {
    it('should limit installs to one page', async () => {
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createInstall(user)
        await TestHelper.wait()
      }
      const req = TestHelper.createRequest('/installs', 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('installs-table')
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
      }
      const req = TestHelper.createRequest('/installs', 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('installs-table')
        const rows = table.getElementsByTagName('tr')
        assert.strictEqual(rows.length, global.pageSize + 1)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce specified offset', async () => {
      const offset = 1
      const user = await TestHelper.createUser()
      const installs = []
      for (let i = 0, len = offset + global.pageSize + 1; i < len; i++) {
        const install = await TestHelper.createInstall(user)
        await TestHelper.wait()
        installs.unshift(install)
      }
      const req = TestHelper.createRequest(`/installs?offset=${offset}`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        for (let i = 0, len = global.pageSize; i < len; i++) {
          assert.strictEqual(doc.getElementById(installs[offset + i].installid).tag, 'tr')
        }
      }
      return req.route.api.get(req, res)
    })
  })
})
