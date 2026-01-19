import { describe, test, expect, beforeEach } from 'bun:test'
import { lazy, preloadLazy, isLazyLoaded, clearLazyCache } from './lazy'
import type { Component } from '../types'

describe('Router - Lazy Loading', () => {
  // Clear cache before each test
  beforeEach(() => {
    clearLazyCache()
  })

  // Mock components
  const MockComponent: Component<{ title: string }> = (props) => {
    return `<div>${props.title}</div>` as any
  }

  const MockComponent2: Component<{ name: string }> = (props) => {
    return `<h1>${props.name}</h1>` as any
  }

  describe('lazy()', () => {
    test('should return wrapper component', () => {
      // Arrange
      const importFn = async () => ({ default: MockComponent })

      // Act
      const LazyComp = lazy(importFn)

      // Assert
      expect(LazyComp).toBeDefined()
      expect(typeof LazyComp).toBe('function')
    })

    test('should return fallback when component not loaded in SSR', () => {
      // Arrange
      const importFn = async () => ({ default: MockComponent })
      const fallback = '<div>Loading...</div>' as any

      // Act
      const LazyComp = lazy(importFn, fallback)
      const result = LazyComp({ title: 'Test' })

      // Assert
      expect(result).toBe(fallback)
    })

    test('should return null when no fallback provided in SSR', () => {
      // Arrange
      const importFn = async () => ({ default: MockComponent })

      // Act
      const LazyComp = lazy(importFn)
      const result = LazyComp({ title: 'Test' })

      // Assert
      expect(result).toBe(null)
    })

    test('should render component when pre-loaded', async () => {
      // Arrange
      const importFn = async () => ({ default: MockComponent })
      await preloadLazy(importFn)

      // Act
      const LazyComp = lazy(importFn)
      const result = LazyComp({ title: 'Hello' })

      // Assert
      expect(result).toBe('<div>Hello</div>')
    })

    test('should use cache for subsequent calls', async () => {
      // Arrange
      const importFn = async () => ({ default: MockComponent })
      await preloadLazy(importFn)

      // Act
      const LazyComp = lazy(importFn)
      const result1 = LazyComp({ title: 'First' })
      const result2 = LazyComp({ title: 'Second' })

      // Assert
      expect(result1).toBe('<div>First</div>')
      expect(result2).toBe('<div>Second</div>')
    })
  })

  describe('preloadLazy()', () => {
    test('should load and cache component', async () => {
      // Arrange
      const importFn = async () => ({ default: MockComponent })

      // Act
      const component = await preloadLazy(importFn)

      // Assert
      expect(component).toBe(MockComponent)
      expect(isLazyLoaded(importFn)).toBe(true)
    })

    test('should return cached component if already loaded', async () => {
      // Arrange
      const importFn = async () => ({ default: MockComponent })

      // Act
      const component1 = await preloadLazy(importFn)
      const component2 = await preloadLazy(importFn)

      // Assert
      expect(component1).toBe(component2)
      expect(component1).toBe(MockComponent)
    })

    test('should handle multiple different components', async () => {
      // Arrange
      const importFn1 = async () => ({ default: MockComponent })
      const importFn2 = async () => ({ default: MockComponent2 })

      // Act
      const component1 = await preloadLazy(importFn1)
      const component2 = await preloadLazy(importFn2)

      // Assert
      expect(component1).toBe(MockComponent)
      expect(component2).toBe(MockComponent2)
      expect(isLazyLoaded(importFn1)).toBe(true)
      expect(isLazyLoaded(importFn2)).toBe(true)
    })

    test('should handle import errors gracefully', async () => {
      // Arrange
      const importFn = async () => {
        throw new Error('Import failed')
      }

      // Act & Assert
      await expect(preloadLazy(importFn)).rejects.toThrow('Import failed')
    })

    test('should not cache failed imports', async () => {
      // Arrange
      let shouldFail = true
      const importFn = async () => {
        if (shouldFail) {
          throw new Error('First attempt failed')
        }
        return { default: MockComponent }
      }

      // Act - First attempt fails
      await expect(preloadLazy(importFn)).rejects.toThrow('First attempt failed')
      expect(isLazyLoaded(importFn)).toBe(false)

      // Second attempt succeeds
      shouldFail = false
      const component = await preloadLazy(importFn)

      // Assert
      expect(component).toBe(MockComponent)
      expect(isLazyLoaded(importFn)).toBe(true)
    })

    test('should deduplicate concurrent loads', async () => {
      // Arrange
      let loadCount = 0
      const importFn = async () => {
        loadCount++
        await new Promise(resolve => setTimeout(resolve, 10))
        return { default: MockComponent }
      }

      // Act - Trigger multiple concurrent loads
      const [comp1, comp2, comp3] = await Promise.all([
        preloadLazy(importFn),
        preloadLazy(importFn),
        preloadLazy(importFn)
      ])

      // Assert
      expect(loadCount).toBe(1) // Should only load once
      expect(comp1).toBe(MockComponent)
      expect(comp2).toBe(MockComponent)
      expect(comp3).toBe(MockComponent)
    })
  })

  describe('isLazyLoaded()', () => {
    test('should return false for non-loaded component', () => {
      // Arrange
      const importFn = async () => ({ default: MockComponent })

      // Act & Assert
      expect(isLazyLoaded(importFn)).toBe(false)
    })

    test('should return true for loaded component', async () => {
      // Arrange
      const importFn = async () => ({ default: MockComponent })

      // Act
      await preloadLazy(importFn)

      // Assert
      expect(isLazyLoaded(importFn)).toBe(true)
    })

    test('should return false for different import functions', async () => {
      // Arrange
      const importFn1 = async () => ({ default: MockComponent })
      const importFn2 = async () => ({ default: MockComponent })
      await preloadLazy(importFn1)

      // Act & Assert
      expect(isLazyLoaded(importFn1)).toBe(true)
      expect(isLazyLoaded(importFn2)).toBe(false)
    })
  })

  describe('clearLazyCache()', () => {
    test('should clear all cached components', async () => {
      // Arrange
      const importFn1 = async () => ({ default: MockComponent })
      const importFn2 = async () => ({ default: MockComponent2 })
      await preloadLazy(importFn1)
      await preloadLazy(importFn2)

      // Act
      clearLazyCache()

      // Assert
      expect(isLazyLoaded(importFn1)).toBe(false)
      expect(isLazyLoaded(importFn2)).toBe(false)
    })

    test('should allow reloading after cache clear', async () => {
      // Arrange
      const importFn = async () => ({ default: MockComponent })
      await preloadLazy(importFn)
      clearLazyCache()

      // Act
      const component = await preloadLazy(importFn)

      // Assert
      expect(component).toBe(MockComponent)
      expect(isLazyLoaded(importFn)).toBe(true)
    })
  })

  describe('SSR Integration', () => {
    test('should render with fallback before preload', () => {
      // Arrange
      const importFn = async () => ({ default: MockComponent })
      const fallback = '<div>Loading...</div>' as any

      // Act
      const LazyComp = lazy(importFn, fallback)
      const result = LazyComp({ title: 'Test' })

      // Assert
      expect(result).toBe(fallback)
    })

    test('should render component after preload', async () => {
      // Arrange
      const importFn = async () => ({ default: MockComponent })
      await preloadLazy(importFn)

      // Act
      const LazyComp = lazy(importFn)
      const result = LazyComp({ title: 'Loaded' })

      // Assert
      expect(result).toBe('<div>Loaded</div>')
    })

    test('should work with multiple lazy components', async () => {
      // Arrange
      const importFn1 = async () => ({ default: MockComponent })
      const importFn2 = async () => ({ default: MockComponent2 })

      // Preload all
      await Promise.all([
        preloadLazy(importFn1),
        preloadLazy(importFn2)
      ])

      // Act
      const LazyComp1 = lazy(importFn1)
      const LazyComp2 = lazy(importFn2)
      const result1 = LazyComp1({ title: 'Component 1' })
      const result2 = LazyComp2({ name: 'Component 2' })

      // Assert
      expect(result1).toBe('<div>Component 1</div>')
      expect(result2).toBe('<h1>Component 2</h1>')
    })
  })

  describe('Type Safety', () => {
    test('should preserve component props types', async () => {
      // Arrange
      type AboutProps = { userId: string; showDetails: boolean }
      const AboutComponent: Component<AboutProps> = (props) => {
        return `<div>User: ${props.userId}, Details: ${props.showDetails}</div>` as any
      }

      const importFn = async () => ({ default: AboutComponent })
      await preloadLazy(importFn)

      // Act
      const LazyAbout = lazy(importFn)
      const result = LazyAbout({ userId: '123', showDetails: true })

      // Assert
      expect(result).toBe('<div>User: 123, Details: true</div>')
    })
  })
})
