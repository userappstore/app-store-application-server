/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../test-helper.js')

describe('/project', () => {
  describe('Project#BEFORE', () => {
    it('should require projectid', async () => {
      const req = TestHelper.createRequest('/project?projectid=', 'GET')
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-projectid')
    })

    it('should reject other account\'s project', async () => {
      const user1 = await TestHelper.createUser()
      const project = await TestHelper.createProject(user1)
      const user2 = await TestHelper.createUser()
      const req = TestHelper.createRequest(`/project?projectid=${project.projectid}`, 'GET')
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

    it('should bind project to req', async () => {
      const user = await TestHelper.createUser()
      const project = await TestHelper.createProject(user)
      const req = TestHelper.createRequest(`/project?projectid=${project.projectid}`, 'GET')
      req.account = user.account
      req.session = user.session
      await req.route.api.before(req)
      assert.strictEqual(req.data.project.projectid, user.project.projectid)
    })
  })

  describe('Project#GET', () => {
    it('should present the project table', async () => {
      const user = await TestHelper.createUser()
      await TestHelper.createProject(user)
      const req = TestHelper.createRequest(`/project?projectid=${user.project.projectid}`, 'GET')
      req.account = user.account
      req.session = user.session
      const res = TestHelper.createResponse()
      res.end = async (str) => {
        const doc = TestHelper.extractDoc(str)
        const table = doc.getElementById('projects-table')
        const tbody = table.getElementById(user.project.projectid)
        assert.strictEqual(tbody.tag, 'tbody')
      }
      return req.route.api.get(req, res)
    })
  })
})
