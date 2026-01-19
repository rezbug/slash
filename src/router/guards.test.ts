import { describe, expect, it } from 'bun:test'
import { executeGuard, combineGuards } from './guards'

describe('guards', () => {
  describe('executeGuard', () => {
    it('should return true when guard returns true', async () => {
      const guard = () => true
      const result = await executeGuard(guard, {}, new URLSearchParams())
      expect(result).toBe(true)
    })

    it('should return false when guard returns false', async () => {
      const guard = () => false
      const result = await executeGuard(guard, {}, new URLSearchParams())
      expect(result).toBe(false)
    })

    it('should return redirect path when guard returns string', async () => {
      const guard = () => '/login'
      const result = await executeGuard(guard, {}, new URLSearchParams())
      expect(result).toBe('/login')
    })

    it('should handle async guard that returns true', async () => {
      const guard = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return true
      }
      const result = await executeGuard(guard, {}, new URLSearchParams())
      expect(result).toBe(true)
    })

    it('should handle async guard that returns false', async () => {
      const guard = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return false
      }
      const result = await executeGuard(guard, {}, new URLSearchParams())
      expect(result).toBe(false)
    })

    it('should handle async guard that returns redirect path', async () => {
      const guard = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return '/unauthorized'
      }
      const result = await executeGuard(guard, {}, new URLSearchParams())
      expect(result).toBe('/unauthorized')
    })

    it('should pass params to guard', async () => {
      const params = { id: '123', slug: 'test' }
      let receivedParams: Record<string, string> = {}

      const guard = (p: Record<string, string>) => {
        receivedParams = p
        return true
      }

      await executeGuard(guard, params, new URLSearchParams())
      expect(receivedParams).toEqual(params)
    })

    it('should pass query to guard', async () => {
      const query = new URLSearchParams('foo=bar&baz=qux')
      let receivedQuery: URLSearchParams | null = null

      const guard = (_p: Record<string, string>, q: URLSearchParams) => {
        receivedQuery = q
        return true
      }

      await executeGuard(guard, {}, query)
      expect(receivedQuery).toEqual(query)
    })
  })

  describe('combineGuards', () => {
    it('should return true when all guards return true', async () => {
      const guard1 = () => true
      const guard2 = () => true
      const guard3 = () => true

      const combined = combineGuards(guard1, guard2, guard3)
      const result = await executeGuard(combined, {}, new URLSearchParams())
      expect(result).toBe(true)
    })

    it('should return false when first guard returns false', async () => {
      const guard1 = () => false
      const guard2 = () => true
      const guard3 = () => true

      const combined = combineGuards(guard1, guard2, guard3)
      const result = await executeGuard(combined, {}, new URLSearchParams())
      expect(result).toBe(false)
    })

    it('should return false when middle guard returns false', async () => {
      const guard1 = () => true
      const guard2 = () => false
      const guard3 = () => true

      const combined = combineGuards(guard1, guard2, guard3)
      const result = await executeGuard(combined, {}, new URLSearchParams())
      expect(result).toBe(false)
    })

    it('should return redirect path from first failing guard', async () => {
      const guard1 = () => true
      const guard2 = () => '/login'
      const guard3 = () => true

      const combined = combineGuards(guard1, guard2, guard3)
      const result = await executeGuard(combined, {}, new URLSearchParams())
      expect(result).toBe('/login')
    })

    it('should stop execution at first failure', async () => {
      let guard3Called = false

      const guard1 = () => true
      const guard2 = () => false
      const guard3 = () => {
        guard3Called = true
        return true
      }

      const combined = combineGuards(guard1, guard2, guard3)
      await executeGuard(combined, {}, new URLSearchParams())
      expect(guard3Called).toBe(false)
    })

    it('should handle async guards', async () => {
      const guard1 = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return true
      }
      const guard2 = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return true
      }

      const combined = combineGuards(guard1, guard2)
      const result = await executeGuard(combined, {}, new URLSearchParams())
      expect(result).toBe(true)
    })

    it('should handle mix of sync and async guards', async () => {
      const guard1 = () => true
      const guard2 = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return true
      }
      const guard3 = () => true

      const combined = combineGuards(guard1, guard2, guard3)
      const result = await executeGuard(combined, {}, new URLSearchParams())
      expect(result).toBe(true)
    })

    it('should pass params and query to all guards', async () => {
      const params = { id: '456' }
      const query = new URLSearchParams('auth=token')

      const receivedParams: Record<string, string>[] = []
      const receivedQueries: URLSearchParams[] = []

      const guard1 = (p: Record<string, string>, q: URLSearchParams) => {
        receivedParams.push(p)
        receivedQueries.push(q)
        return true
      }
      const guard2 = (p: Record<string, string>, q: URLSearchParams) => {
        receivedParams.push(p)
        receivedQueries.push(q)
        return true
      }

      const combined = combineGuards(guard1, guard2)
      await executeGuard(combined, params, query)

      expect(receivedParams).toHaveLength(2)
      expect(receivedParams[0]).toEqual(params)
      expect(receivedParams[1]).toEqual(params)
      expect(receivedQueries[0]).toEqual(query)
      expect(receivedQueries[1]).toEqual(query)
    })
  })
})
