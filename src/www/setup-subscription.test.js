/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')
const userAppStore = require('../../index.js')

describe('/setup-subscription', () => {
  describe('SetupSubscription#BEFORE', () => {
    it('should require installid', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/setup-subscription?installid=', 'GET')
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

    it('should require own installid', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1', text: 'the text' })
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/setup-subscription?installid=${install.installid}`, 'GET')
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

    it('should reject non-app install', async () => {
      const user = await TestHelper.createUser()
      const install = await TestHelper.createInstall(user, { url: 'https://something', text: 'the text' })
      const req = TestHelper.createRequest(`/setup-subscription?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.post(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-install')
    })

    it('should bind install to req', async () => {
      const user = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1', text: 'the text' })
      const req = TestHelper.createRequest(`/setup-subscription?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.install.installid, install.installid)
    })

    it('should bind organization to req', async () => {
      const user = await TestHelper.createUser()
      const user2 = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/organizations/organization?organizationid=organization_1`]: { organizationid: 'organization_1', ownerid: user.account.accountid },
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
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1', organizationid: 'organization_1', text: 'the text' })
      const req = TestHelper.createRequest(`/setup-subscription?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.organization.organizationid, 'organization_1')
    })

    it('should bind organization members to req', async () => {
      const user = await TestHelper.createUser()
      const user2 = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/organizations/organization?organizationid=organization_1`]: { organizationid: 'organization_1', ownerid: user.account.accountid },
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
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1', organizationid: 'organization_1', text: 'the text' })
      const req = TestHelper.createRequest(`/setup-subscription?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.memberships[0].membershipid, 'membership_1')
    })
  })

  describe('SetupSubscription#GET', () => {
    it('should present the members list', async () => {
      const user = await TestHelper.createUser()
      const user2 = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/organizations/organization?organizationid=organization_1`]: { organizationid: 'organization_1', ownerid: user.account.accountid },
        [`/api/user/organizations/organization-memberships?organizationid=organization_1`]: [{
          membershipid: 'membership_1',
          object: 'membership',
          accountid: user.account.accountid,
          email: user.profile.email
        }, {
          membershipid: 'membership_2',
          object: 'membership',
          accountid: user2.account.accountid,
          email: user2.profile.email
        }]
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1', organizationid: 'organization_1', text: 'the text' })
      const req = TestHelper.createRequest(`/setup-subscription?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        assert.strictEqual(doc.getElementById('member-membership_1').tag, 'input')
        assert.strictEqual(doc.getElementById('member-membership_2').tag, 'input')
      }
      return req.route.api.get(req, res)
    })
  })

  describe('SetupSubscription#POST', () => {
    it('should reject invalid membership', async () => {
      const user = await TestHelper.createUser()
      const user2 = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/organizations/organization?organizationid=organization_1`]: { organizationid: 'organization_1', ownerid: user.account.accountid },
        [`/api/user/organizations/organization-memberships?organizationid=organization_1`]: [{
          membershipid: 'membership_1',
          object: 'membership',
          accountid: user.account.accountid,
          email: user.profile.email
        }, {
          membershipid: 'membership_2',
          object: 'membership',
          accountid: user2.account.accountid,
          email: user2.profile.email
        }]
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1', organizationid: 'organization_1', text: 'the text' })
      const req = TestHelper.createRequest(`/setup-subscription?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        ['member-invalid']: 'true'
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, 'invalid-membershipid')

      }
      return req.route.api.post(req, res)
    })

    it('should redirect to confirmation page with no members', async () => {
      const user = await TestHelper.createUser()
      const user2 = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: { id: "stripe_1", object: 'account', created: 2, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true }
      }
      const app = await TestHelper.createApp(user, { published: true, url: 'https://something', stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: { id: "stripe_1", object: 'account', created: 2, legal_entity: { type: 'individual' }, metadata: { accountid: user.account.accountid }, payouts_enabled: true },
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/organizations/organization?organizationid=organization_1`]: { organizationid: 'organization_1', ownerid: user.account.accountid },
        [`/api/user/organizations/organization-memberships?organizationid=organization_1`]: [{
          membershipid: 'membership_1',
          object: 'membership',
          accountid: user.account.accountid,
          email: user.profile.email
        }, {
          membershipid: 'membership_2',
          object: 'membership',
          accountid: user2.account.accountid,
          email: user2.profile.email
        }]
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1', organizationid: 'organization_1', text: 'the text' })
      const req = TestHelper.createRequest(`/setup-subscription?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        [`member-membership_2`]: 'true'
      }
      const res = TestHelper.createResponse()
      res.end = async () => {
        assert.strictEqual(res.statusCode, 302)
        assert.notStrictEqual(res.headers['location'], null)
        assert.notStrictEqual(res.headers['location'], undefined)
        const installReq = { query: { installid: install.installid } }
        installReq.account = user.account
        installReq.session = user.session
        const installNow = await global.api.user.userappstore.Install.get(installReq)
        assert.strictEqual(installNow.subscriptions[0], 'membership_2')
      }
      return req.route.api.post(req, res)
    })

    it('should set members and redirect to confirmation page', async () => {
      const user = await TestHelper.createUser()
      const user2 = await TestHelper.createUser()
      global.testResponse = {
        [`/api/user/connect/stripe-account?stripeid=stripe_1`]: {
          id: 'stripe_1', object: 'account', payouts_enabled: true, metadata: { created: 1, accountid: user.account.accountid }, legal_entity: { type: 'individual' }
        }
      }
      const app = await TestHelper.createApp(user, { url: 'https://something', published: true, stripeid: 'stripe_1', application_fee: '0.05' })
      global.testResponse = {
        [`/api/user/${app.appid}/subscriptions/published-plans`]: [{ id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } }],
        [`/api/user/${app.appid}/subscriptions/published-plan?planid=plan_1`]: { id: 'plan_1', object: 'plan', metadata: { published: true, appid: app.appid } },
        [`/api/user/organizations/organization?organizationid=organization_1`]: { organizationid: 'organization_1', ownerid: user.account.accountid },
        [`/api/user/organizations/organization-memberships?organizationid=organization_1`]: [{
          membershipid: 'membership_1',
          object: 'membership',
          accountid: user.account.accountid,
          email: user.profile.email
        }, {
          membershipid: 'membership_2',
          object: 'membership',
          accountid: user2.account.accountid,
          email: user2.profile.email
        }]
      }
      const install = await TestHelper.createInstall(user, { appid: app.appid, planid: 'plan_1', organizationid: 'organization_1', text: 'the text' })
      const req = TestHelper.createRequest(`/setup-subscription?installid=${install.installid}`, 'GET')
      req.account = user.account
      req.session = user.session
      req.body = {
        ['member-membership_2']: 'true'
      }
      const res = TestHelper.createResponse()
      res.end = async () => {
        assert.strictEqual(res.statusCode, 302)
        assert.notStrictEqual(res.headers['location'], null)
        assert.notStrictEqual(res.headers['location'], undefined)
      }
      return req.route.api.post(req, res)
    })
  })
})
