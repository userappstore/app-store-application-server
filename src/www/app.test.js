/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/app', () => {
  describe('App#BEFORE', () => {
    it('should require appid', async () => {
      const req = TestHelper.createRequest('/app?appid=', 'GET')
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-appid')
    })

    it('should reject other account\'s app', async () => {
      const user1 = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user1.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user1, { url: 'https://something', stripeid: 'stripe_1', published: true, application_fee: '0.05' })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/app?appid=${app.appid}`, 'GET')
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

    it('should bind app to req', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { published: true, url: 'https://something', stripeid: 'stripe_1', application_fee: '0.05' })
      const req = TestHelper.createRequest(`/app?appid=${app.appid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.app.appid, user.app.appid)
    })
  })

  describe('App#GET', () => {
    it('should present the app table', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { published: true, url: 'https://something', stripeid: 'stripe_1', application_fee: '0.05' })
      const req = TestHelper.createRequest(`/app?appid=${app.appid}`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('apps-table')
        const tbody = table.getElementById(app.appid)
        assert.strictEqual(tbody.tag, 'tbody')
      }
      return req.route.api.get(req, res)
    })
  })
})
