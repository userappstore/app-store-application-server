/* eslint-env mocha */
const assert = require('assert')
const UUID = require('./uuid.js')

describe('internal-api/uuid', async () => {
  describe('#friendly', async () => {
    it('should generate a three-word id', async () => {
      const id = UUID.friendly()
      const parts = id.split('-')
      assert.strictEqual(parts.length, 3)
    })
    it('length should be at least xxx-xxx-xxx', async () => {
      const id = UUID.friendly()
      assert.strictEqual(id.length > 10, true)
    })
  })

  describe('#v4()', async () => {
    it('should be a v4 uuid', async () => {
      const v4 = UUID.v4()
      assert.strictEqual(v4.length, '45db52e1-f95c-4b5f-99a2-8b8d978c99b4'.length)
      const parts = v4.split('-')
      assert.strictEqual(parts.length, 5)
      assert.strictEqual(parts[0].length, 8)
      assert.strictEqual(parts[1].length, 4)
      assert.strictEqual(parts[2].length, 4)
      assert.strictEqual(parts[3].length, 4)
      assert.strictEqual(parts[4].length, 12)
    })
  })
})
