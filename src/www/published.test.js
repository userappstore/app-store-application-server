/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/published', () => {
  describe('Published#BEFORE', () => {
    it('should bind apps to req', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', stripeid: 'stripe_1', published: true, application_fee: '0.05' })
      await TestHelper.wait()
      const req = TestHelper.createRequest(`/published`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.apps[0].appid, app.appid)
    })
  })

  describe('Published#GET', () => {
    it('should limit apps to one page', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createApp(user, { url: 'https://something', stripeid: 'stripe_1', published: true, application_fee: '0.05' })
        await TestHelper.wait()
      }
      const req = TestHelper.createRequest('/published', 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('apps-table')
        const rows = table.getElementsByTagName('tr')
        assert.strictEqual(rows.length, global.pageSize + 1)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce page size', async () => {
      global.pageSize = 3
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        await TestHelper.createApp(user, { url: 'https://something', stripeid: 'stripe_1', published: true })
        await TestHelper.wait()
      }
      const req = TestHelper.createRequest('/published', 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('apps-table')
        const rows = table.getElementsByTagName('tr')
        assert.strictEqual(rows.length, global.pageSize + 1)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce specified offset', async () => {
      const offset = 1
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const apps = []
      for (let i = 0, len = offset + global.pageSize + 1; i < len; i++) {
        const app = await TestHelper.createApp(user, { url: 'https://something', stripeid: 'stripe_1', published: true, application_fee: '0.05' })
        await TestHelper.wait()
        apps.unshift(app)
      }
      const req = TestHelper.createRequest(`/published?offset=${offset}`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        for (let i = 0, len = global.pageSize; i < len; i++) {
          assert.strictEqual(doc.getElementById(apps[offset + i].appid).tag, 'tr')
        }
      }
      return req.route.api.get(req, res)
    })
  })
})
