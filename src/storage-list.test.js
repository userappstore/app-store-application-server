/* eslint-env mocha */
const assert = require('assert')
const StorageList = require('./storage-list.js')
const util = require('util')

const wait = util.promisify(function(callback) {
  if (process.env.STORAGE_ENGINE) {
    return callback()
  }
  return setTimeout(callback, 1100)
})

describe('internal-api/storage-list', async () => {
  describe('StorageList#add', () => {
    it('should add string properties', async () => {
      await StorageList.add('test-data', 'string')
      const objects = await StorageList.list('test-data')
      assert.strictEqual(objects.length, 1)
      assert.strictEqual(objects[0], 'string')
    })

    it('should add int properties', async () => {
      await StorageList.add('test-data', 3)
      const objects = await StorageList.list('test-data')
      assert.strictEqual(objects.length, 1)
      assert.strictEqual(objects[0], 3)
    })

    it('should add float properties', async () => {
      await StorageList.add('test-data', 1.4)
      const objects = await StorageList.list('test-data')
      assert.strictEqual(objects.length, 1)
      assert.strictEqual(objects[0], 1.4)
    })

    it('should add boolean properties', async () => {
      await StorageList.add('test-data', true)
      const objects = await StorageList.list('test-data')
      assert.strictEqual(objects.length, 1)
      assert.strictEqual(objects[0], true)
    })
  })

  describe('StorageList#count', async () => {
    it('should count the items', async () => {
      await StorageList.add('test-data', 1)
      await wait()
      await StorageList.add('test-data', 2)
      await wait()
      await StorageList.add('test-data', 3)
      const count = await StorageList.count('test-data')
      assert.strictEqual(count, 3)
    })

    it('should not count removed items', async () => {
      await StorageList.add('test-data', 1)
      await wait()
      await StorageList.add('test-data', 2)
      await wait()
      await StorageList.add('test-data', 3)
      await StorageList.remove('test-data', 3)
      const count = await StorageList.count('test-data')
      assert.strictEqual(count, 2)
    })
  })

  describe('StorageList#remove', () => {
    it('should remove the item', async () => {
      await StorageList.add('test-data', 1)
      await wait()
      await StorageList.remove('test-data', 1)
      await wait()
      const count = await StorageList.count('test-data')
      assert.strictEqual(count, 0)
    })
  })

  describe('StorageList#list', async () => {
    it('should enforce page size', async () => {
      global.pageSize = 3
      await StorageList.add('test-data', 1)
      await wait()
      await StorageList.add('test-data', 2)
      await wait()
      await StorageList.add('test-data', 3)
      await wait()
      await StorageList.add('test-data', 4)
      const listed = await StorageList.list('test-data')
      assert.strictEqual(listed.length, global.pageSize)
      assert.strictEqual(listed[0], 4)
      assert.strictEqual(listed[1], 3)
      assert.strictEqual(listed[2], 2)
    })

    it('should enforce offset', async () => {
      const offset = 1
      global.pageSize = 2
      await StorageList.add('test-data', 1)
      await wait()
      await StorageList.add('test-data', 2)
      await wait()
      await StorageList.add('test-data', 3)
      const listed = await StorageList.list('test-data', offset)
      assert.strictEqual(listed.length, global.pageSize)
      assert.strictEqual(listed[0], 2)
      assert.strictEqual(listed[1], 1)
    })
  })

  describe('StorageList#listAll', async () => {
    it('should return all records', async () => {
      await StorageList.add('test-data', 1)
      await wait()
      await StorageList.add('test-data', 2)
      await wait()
      await StorageList.add('test-data', 3)
      await wait()
      await StorageList.add('test-data', 4)
      await wait()
      await StorageList.add('test-data', 5)
      await wait()
      await StorageList.add('test-data', 6)
      const listed = await StorageList.listAll('test-data')
      assert.strictEqual(listed.length, 6)
      assert.strictEqual(listed[0], 6)
      assert.strictEqual(listed[1], 5)
      assert.strictEqual(listed[2], 4)
      assert.strictEqual(listed[3], 3)
      assert.strictEqual(listed[4], 2)
      assert.strictEqual(listed[5], 1)
    })
  })
})

