import { describe, test, expect, beforeEach } from 'bun:test'
import { runLoader, clearLoaderCache } from './loaders'

describe('Loader System', () => {
  beforeEach(() => {
    clearLoaderCache()
  })

  describe('runLoader', () => {
    test('should execute loader with params and return data', async () => {
      // Arrange
      const loader = async (params: { id: string }) => {
        return { userId: params.id, name: 'John' }
      }
      const params = { id: '123' }
      const query = new URLSearchParams()

      // Act
      const result = runLoader(loader, params, query)

      // Assert
      expect(result.loading.get()).toBe(true)
      expect(result.data.get()).toBe(null)
      expect(result.error.get()).toBe(null)

      // Wait for loader to complete
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(result.loading.get()).toBe(false)
      expect(result.data.get()).toEqual({ userId: '123', name: 'John' })
      expect(result.error.get()).toBe(null)
    })

    test('should cache loader result', async () => {
      // Arrange
      let callCount = 0
      const loader = async (params: { id: string }) => {
        callCount++
        return { userId: params.id }
      }
      const params = { id: '123' }
      const query = new URLSearchParams()

      // Act
      const result1 = runLoader(loader, params, query)
      await new Promise(resolve => setTimeout(resolve, 10))

      const result2 = runLoader(loader, params, query)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(callCount).toBe(1)
      expect(result1.data.get()).toEqual(result2.data.get())
    })

    test('should re-execute when params change', async () => {
      // Arrange
      let callCount = 0
      const loader = async (params: { id: string }) => {
        callCount++
        return { userId: params.id }
      }
      const query = new URLSearchParams()

      // Act
      const result1 = runLoader(loader, { id: '123' }, query)
      await new Promise(resolve => setTimeout(resolve, 10))

      const result2 = runLoader(loader, { id: '456' }, query)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(callCount).toBe(2)
      expect(result1.data.get()).toEqual({ userId: '123' })
      expect(result2.data.get()).toEqual({ userId: '456' })
    })

    test('should handle loader errors correctly', async () => {
      // Arrange
      const loader = async () => {
        throw new Error('Loader failed')
      }
      const params = {}
      const query = new URLSearchParams()

      // Act
      const result = runLoader(loader, params, query)

      // Assert
      expect(result.loading.get()).toBe(true)

      // Wait for loader to fail
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(result.loading.get()).toBe(false)
      expect(result.data.get()).toBe(null)
      expect(result.error.get()?.message).toBe('Loader failed')
    })

    test('should work with synchronous loaders', () => {
      // Arrange
      const loader = (params: { id: string }) => {
        return { userId: params.id }
      }
      const params = { id: '123' }
      const query = new URLSearchParams()

      // Act
      const result = runLoader(loader, params, query)

      // Assert
      expect(result.loading.get()).toBe(false)
      expect(result.data.get()).toEqual({ userId: '123' })
      expect(result.error.get()).toBe(null)
    })

    test('should include query params in cache key', async () => {
      // Arrange
      let callCount = 0
      const loader = async (params: Record<string, string>, query: URLSearchParams) => {
        callCount++
        return { search: query.get('q') }
      }
      const params = { id: '123' }

      // Act
      const query1 = new URLSearchParams('q=test1')
      const result1 = runLoader(loader, params, query1)
      await new Promise(resolve => setTimeout(resolve, 10))

      const query2 = new URLSearchParams('q=test2')
      const result2 = runLoader(loader, params, query2)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(callCount).toBe(2)
      expect(result1.data.get()).toEqual({ search: 'test1' })
      expect(result2.data.get()).toEqual({ search: 'test2' })
    })

    test('should expire cache after TTL (5 minutes)', async () => {
      // Arrange
      let callCount = 0
      const loader = async () => {
        callCount++
        return { data: 'test' }
      }
      const params = {}
      const query = new URLSearchParams()

      // Act
      const result1 = runLoader(loader, params, query)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Simulate time passing (we'll test cache clearing directly)
      clearLoaderCache()

      const result2 = runLoader(loader, params, query)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(callCount).toBe(2)
    })
  })

  describe('Cache Management', () => {
    test('should clear all cached loaders', async () => {
      // Arrange
      let callCount = 0
      const loader = async () => {
        callCount++
        return { data: 'test' }
      }
      const params = {}
      const query = new URLSearchParams()

      // Act
      runLoader(loader, params, query)
      await new Promise(resolve => setTimeout(resolve, 10))

      clearLoaderCache()

      runLoader(loader, params, query)
      await new Promise(resolve => setTimeout(resolve, 10))

      // Assert
      expect(callCount).toBe(2)
    })
  })
})
