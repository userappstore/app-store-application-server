/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/organizations', () => {
  describe('Organizations#BEFORE', () => {
    it('should bind organizations to req', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/organizations`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/organizations/organizations-count?accountid=${user.account.accountid}`]: 1,
        [`/api/user/organizations/organizations?accountid=${user.account.accountid}&offset=0`]: [{
          organizationid: 'organization_1',
          object: 'organization',
          name: 'organization'
        }]
      }
      await req.route.api.before(req)
      assert.strictEqual(req.data.organizations[0].organizationid, 'organization_1')
    })
  })

  describe('Organizations#GET', () => {
    it('should limit organizations to one page', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/organizations', 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/organizations/organizations-count?accountid=${user.account.accountid}`]: 3,
        [`/api/user/organizations/organizations?accountid=${user.account.accountid}&offset=0`]: [{
          organizationid: 'organization_3',
          object: 'organization',
          name: 'organization'
        }, {
          organizationid: 'organization_2',
          object: 'organization',
          name: 'organization'
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('organizations-table')
        const rows = table.getElementsByTagName('tr')
        assert.strictEqual(rows.length, global.pageSize + 1)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce page size', async () => {
      global.pageSize = 3
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/organizations', 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/organizations/organizations-count?accountid=${user.account.accountid}`]: 4,
        [`/api/user/organizations/organizations?accountid=${user.account.accountid}&offset=0`]: [{
          organizationid: 'organization_4',
          object: 'organization',
          name: 'organization'
        }, {
          organizationid: 'organization_3',
          object: 'organization',
          name: 'organization'
        }, {
          organizationid: 'organization_2',
          object: 'organization',
          name: 'organization'
        }]
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('organizations-table')
        const rows = table.getElementsByTagName('tr')
        assert.strictEqual(rows.length, global.pageSize + 1)
      }
      return req.route.api.get(req, res)
    })

    it('should enforce specified offset', async () => {
      const offset = 1
      const user = await TestHelper.createUser()
      const organizations = [{
        organizationid: 'organization_3',
        object: 'organization',
        name: 'organization'
      }, {
        organizationid: 'organization_2',
        object: 'organization',
        name: 'organization'
      }, {
        organizationid: 'organization_1',
        object: 'organization',
        name: 'organization'
      }]
      const req = TestHelper.createRequest(`/organizations?offset=${offset}`, 'GET')
      req.account = user.account
      req.session = user.session
      global.testResponse = {
        [`/api/user/organizations/organizations-count?accountid=${user.account.accountid}`]: 3,
        [`/api/user/organizations/organizations?accountid=${user.account.accountid}&offset=${offset}`]: organizations
      }
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        for (let i = 0, len = global.pageSize; i < len; i++) {
          assert.strictEqual('tr', doc.getElementById(organizations[offset + i].organizationid).tag)
        }
      }
      return req.route.api.get(req, res)
    })
  })
})
