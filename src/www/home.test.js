/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/home', () => {
  describe('Home#BEFORE', () => {
    it('should bind apps to req', async () => {
      const user = await TestHelper.createUser()
      const developer1 = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: developer1.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app1 = await TestHelper.createApp(developer1, { url: 'https://something', stripeid: 'stripe_1', published: true, application_fee: '0.05' })
      await TestHelper.wait()
      const developer2 = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_2`]: {
          id: 'stripe_2', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: developer2.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app2 = await TestHelper.createApp(developer2, { url: 'https://something', stripeid: 'stripe_2', published: true, application_fee: '0.05' })
      await TestHelper.wait()
      const req = TestHelper.createRequest(`/home`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/subscriptions/subscriptions?accountid=${user.account.accountid}&all=true`]: []
      }
      await req.route.api.before(req)
      assert.strictEqual(req.data.apps[0].appid, app2.appid)
      assert.strictEqual(req.data.apps[1].appid, app1.appid)
    })
  })

  describe('Home#GET', () => {
    it('should limit apps to one page', async () => {
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const developer = await TestHelper.createUser()
        global.testResponse = {
          [`/api/user/connect/stripe-account?stripeid=stripe_${i}`]: {
            id: `stripe_${i}`, object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: developer.account.accountid }, legal_entity: { type: 'individual' }
          }
        }
        await TestHelper.createApp(developer, { url: 'https://something', stripeid: `stripe_${i}`, published: true, application_fee: '0.05' })
        await TestHelper.wait()
      }
      const req = TestHelper.createRequest('/home', 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/subscriptions/subscriptions?accountid=${user.account.accountid}&all=true`]: []
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const list = doc.getElementById('apps-list')
        const rows = list.getElementsByTagName('li')
        assert.strictEqual(rows.length, global.pageSize)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce page size', async () => {
      global.pageSize = 3
      const user = await TestHelper.createUser()
      for (let i = 0, len = global.pageSize + 1; i < len; i++) {
        const developer = await TestHelper.createUser()
        global.testResponse = {
          [`/api/user/connect/stripe-account?stripeid=stripe_${i}`]: {
            id: `stripe_${i}`, object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: developer.account.accountid }, legal_entity: { type: 'individual' }
          }
        }
        await TestHelper.createApp(developer, { url: 'https://something', stripeid: `stripe_${i}`, published: true, application_fee: '0.05' })
        await TestHelper.wait()
      }
      const req = TestHelper.createRequest('/home', 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/subscriptions/subscriptions?accountid=${user.account.accountid}&all=true`]: []
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const list = doc.getElementById('apps-list')
        const rows = list.getElementsByTagName('li')
        assert.strictEqual(rows.length, global.pageSize)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce specified offset', async () => {
      const offset = 1
      const user = await TestHelper.createUser()
      const apps = []
      for (let i = 0, len = offset + global.pageSize + 1; i < len; i++) {
        const developer = await TestHelper.createUser()
        global.testResponse = {
          [`/api/user/connect/stripe-account?stripeid=stripe_${i}`]: {
            id: `stripe_${i}`, object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: developer.account.accountid }, legal_entity: { type: 'individual' }
          }
        }
        const app = await TestHelper.createApp(developer, { url: 'https://something', stripeid: `stripe_${i}`, published: true, application_fee: '0.05' })
        await TestHelper.wait()
        apps.unshift(app)
      }
      const req = TestHelper.createRequest(`/home?offset=${offset}`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/subscriptions/subscriptions?accountid=${user.account.accountid}&all=true`]: []
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        for (let i = 0, len = global.pageSize; i < len; i++) {
          assert.strictEqual(doc.getElementById(apps[offset + i].appid).tag, 'li')
        }
      }
      return req.route.api.get(req, res)
    })
  })
})
