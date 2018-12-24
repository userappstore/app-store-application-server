/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/confirm-subscription', () => {
  describe('ConfirmSubscription#BEFORE', () => {
    it('should require installid', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      const req = TestHelper.createRequest('/confirm-subscription?installid=', 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: {}
      }
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
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user1.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user1, { url: 'https://something', stripeid: 'stripe_1', published: true, application_fee: '0.05' })
      const install1 = await TestHelper.createInstall(user1, { appid: app.appid })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/confirm-subscription?installid=${install1.installid}`, 'GET')
      req.account = user2.account
      req.session = user2.session
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: {}
      }
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-account')
    })

    it('should bind install without organization to req', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1' })
      const req = TestHelper.createRequest(`/confirm-subscription?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.install.installid, install.installid)
    })

    it('should bind install, organization and members to req', async () => {
      const user = await TestHelper.createUser()
      const user2 = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/organizations/organization?organizationid=organization_1`]: { id: 'organization_1', object: 'organization', owner: user.account.accountid },
        [`/api/user/organizations/organization-memberships?organizationid=organization_1`]: [{
          membershipid: 'membership_1',
          accountid: user.account.accountid
        }, {
          membershipid: 'membership_2',
          accountid: user2.account.accountid
        }]
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1', organizationid: 'organization_1' })
      const req = TestHelper.createRequest(`/confirm-subscription?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/organizations/organization?organizationid=organization_1`]: { id: 'organization_1', object: 'organization', owner: user.account.accountid },
        [`/api/user/organizations/organization-memberships?organizationid=organization_1`]: [{
          membershipid: 'membership_1',
          accountid: user.account.accountid
        }, {
          membershipid: 'membership_2',
          accountid: user2.account.accountid
        }]
      }
      await req.route.api.before(req)
      assert.strictEqual(req.data.install.installid, install.installid)
    })
  })

  describe('ConfirmSubscription#GET', () => {
    it('should present the plan table', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1' })
      const req = TestHelper.createRequest(`/confirm-subscription?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: {}
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        assert.strictEqual(doc.getElementById('plan-table').tag, 'table')
      }
      return req.route.api.get(req, res)
    })

    it('should present the charge information', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', metadata: { published: true, appid: app.appid }, amount: 1000 }
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1' })
      const req = TestHelper.createRequest(`/confirm-subscription?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', metadata: { published: true, appid: app.appid }, amount: 1000 }
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        assert.strictEqual(doc.getElementById('charge').tag, 'div')
      }
      return req.route.api.get(req, res)
    })

    it('should present the included organization members', async () => {
      const user = await TestHelper.createUser()
      const user2 = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/organizations/organization?organizationid=organization_1`]: { id: 'organization_1', object: 'organization', owner: user.account.accountid },
        [`/api/user/organizations/organization-memberships?organizationid=organization_1`]: [{
          membershipid: 'membership_1',
          accountid: user.account.accountid
        }, {
          membershipid: 'membership_2',
          accountid: user2.account.accountid
        }]
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1', organizationid: 'organization_1', [`member-membership_2`]: true })
      const req = TestHelper.createRequest(`/confirm-subscription?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/organizations/organization?organizationid=organization_1`]: { id: 'organization_1', object: 'organization', owner: user.account.accountid },
        [`/api/user/organizations/organization-memberships?organizationid=organization_1`]: [{
          membershipid: 'membership_1',
          accountid: user.account.accountid,
          email: user.profile.email
        }, {
          membershipid: 'membership_2',
          accountid: user2.account.accountid,
          email: user2.profile.email
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        assert.strictEqual(doc.getElementById(user2.account.accountid).tag, 'tr')
      }
      return req.route.api.get(req, res)
    })
  })
})
