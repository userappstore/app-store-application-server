/* eslint-env mocha */
const assert = require('assert')
const StorageObject = require('./storage-object.js')

describe('internal-api/storage-list', () => {
  describe('StorageObject#getProperties', async () => {
    it('should return string properties', async () => {
      const testObject = {
        one: '1',
        two: '2'
      }
      await StorageObject.setProperties('test-object', testObject)
      const object = await StorageObject.getProperties('test-object', Object.keys(testObject))
      assert.strictEqual(object.one, testObject.one)
      assert.strictEqual(object.two, testObject.two)
    })    
    
    it('should return int properties', async () => {
      const testObject = {
        one: 1,
        two: 2
      }
      await StorageObject.setProperties('test-object', testObject)
      const object = await StorageObject.getProperties('test-object', ['one', 'two'])
      assert.strictEqual(object.one, testObject.one)
      assert.strictEqual(object.two, testObject.two)
    })

    it('should return float properties', async () => {
      const testObject = {
        one: 1.1,
        two: 2.2
      }
      await StorageObject.setProperties('test-object', testObject)
      const object = await StorageObject.getProperties('test-object', ['one', 'two'])
      assert.strictEqual(object.one, testObject.one)
      assert.strictEqual(object.two, testObject.two)
    })

    it('should return boolean properties', async () => {
      const testObject = {
        one: true,
        two: false
      }
      await StorageObject.setProperties('test-object', testObject)
      const object = await StorageObject.getProperties('test-object', ['one', 'two'])
      assert.strictEqual(object.one, testObject.one)
      assert.strictEqual(object.two, testObject.two)
    })
  })

  describe('StorageObject#getProperty', () => {
    it('should return string property', async () => {
      await StorageObject.setProperty('test-object', 'property', 'thing')
      const property = await StorageObject.getProperty('test-object', 'property')
      assert.strictEqual(property, 'thing')
    })

    it('should return int property', async () => {
      await StorageObject.setProperty('test-object', 'property', 12)
      const property = await StorageObject.getProperty('test-object', 'property')
      assert.strictEqual(property, 12)
    })

    it('should return float property', async () => {
      await StorageObject.setProperty('test-object', 'property', 1.31)
      const property = await StorageObject.getProperty('test-object', 'property')
      assert.strictEqual(property, 1.31)
    })

    it('should return boolean property', async () => {
      await StorageObject.setProperty('test-object', 'property', true)
      const property = await StorageObject.getProperty('test-object', 'property')
      assert.strictEqual(property, true)
    })
  })  
  
  describe('StorageObject#removeProperty', () => {
    it('should delete properties', async () => {
      await StorageObject.setProperties('test-object', { one: true, two: 'thing', three: 8 })
      await StorageObject.removeProperties('test-object', ['one', 'two'])
      const object = await StorageObject.getProperties('test-object', ['one', 'two', 'three'])
      assert.strictEqual(object.one, undefined)
      assert.strictEqual(object.two, undefined)
      assert.strictEqual(object.three, 8)
    })
  })  
  
  describe('StorageObject#removeProperties', () => {
    it('should delete properties', async () => {
      await StorageObject.setProperty('test-object', 'property', true)
      await StorageObject.removeProperty('test-object', 'property')
      const property = await StorageObject.getProperty('test-object', 'property')
      assert.strictEqual(property, undefined)
    })
  })  
  
  describe('StorageObject#setProperty', () => {
    it('should set string property', async () => {
      await StorageObject.setProperty('test-object', 'property', 'thing')
      const property = await StorageObject.getProperty('test-object', 'property')
      assert.strictEqual(property, 'thing')
    })

    it('should set int property', async () => {
      await StorageObject.setProperty('test-object', 'property', 12)
      const property = await StorageObject.getProperty('test-object', 'property')
      assert.strictEqual(property, 12)
    })

    it('should set float property', async () => {
      await StorageObject.setProperty('test-object', 'property', 1.31)
      const property = await StorageObject.getProperty('test-object', 'property')
      assert.strictEqual(property, 1.31)
    })

    it('should set boolean property', async () => {
      await StorageObject.setProperty('test-object', 'property', true)
      const property = await StorageObject.getProperty('test-object', 'property')
      assert.strictEqual(property, true)
    })
  })  
  
  describe('StorageObject#setProperties', () => {
    it('should set string properties', async () => {
      const testObject = {
        one: '1',
        two: '2'
      }
      await StorageObject.setProperties('test-object', testObject)
      const object = await StorageObject.getProperties('test-object', Object.keys(testObject))
      assert.strictEqual(object.one, testObject.one)
      assert.strictEqual(object.two, testObject.two)
    })

    it('should set int properties', async () => {
      const testObject = {
        one: 1,
        two: 2
      }
      await StorageObject.setProperties('test-object', testObject)
      const object = await StorageObject.getProperties('test-object', ['one', 'two'])
      assert.strictEqual(object.one, testObject.one)
      assert.strictEqual(object.two, testObject.two)
    })

    it('should set float properties', async () => {
      const testObject = {
        one: 1.1,
        two: 2.2
      }
      await StorageObject.setProperties('test-object', testObject)
      const object = await StorageObject.getProperties('test-object', ['one', 'two'])
      assert.strictEqual(object.one, testObject.one)
      assert.strictEqual(object.two, testObject.two)
    })

    it('should set boolean properties', async () => {
      const testObject = {
        one: true,
        two: false
      }
      await StorageObject.setProperties('test-object', testObject)
      const object = await StorageObject.getProperties('test-object', ['one', 'two'])
      assert.strictEqual(object.one, testObject.one)
      assert.strictEqual(object.two, testObject.two)
    })
  })  
})

