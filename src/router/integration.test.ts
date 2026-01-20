import { describe, test, expect, beforeEach } from 'bun:test'
import { renderToString } from '../server-render'
import { Router } from './Router'
import { Route } from './Route'
import { Link } from './Link'
import { router } from './state'
import { clearLoaderCache } from './loaders'

describe('Router Integration (SSR - Imperative API)', () => {
  beforeEach(() => {
    // Reset router state before each test
    router._setState({
      pathname: '/',
      params: {},
      search: '',
      isNavigating: false,
    })
    clearLoaderCache()
  })

  test('renderiza home page com SSR', () => {
    const Home = () => 'Home Page'

    const App = () => Router({
      location: '/',
      children: () => Route({
        path: '/',
        component: Home,
      })
    })

    const { html: output } = renderToString(App)

    expect(output).toContain('Home Page')
  })

  test('renderiza página com parâmetros', () => {
    const User = ({ params }: { params: { id: string } }) => `User ${params.id}`

    const App = () => Router({
      location: '/users/123',
      children: () => Route({
        path: '/users/:id',
        component: User,
      })
    })

    const { html: output } = renderToString(App)

    expect(output).toContain('User 123')
  })

  test('renderiza links com href correto', () => {
    const App = () => Router({
      location: '/',
      children: () => Link({
        to: '/about',
        children: 'About',
      })
    })

    const { html: output } = renderToString(App)

    expect(output).toContain('href="/about"')
    expect(output).toContain('About')
  })

  test('aplica active class em link ativo', () => {
    const App = () => Router({
      location: '/about',
      children: () => Link({
        to: '/about',
        children: 'About',
      })
    })

    const { html: output } = renderToString(App)

    expect(output).toContain('active')
  })

  test('não renderiza rota que não match', () => {
    const About = () => 'About Page'

    const App = () => Router({
      location: '/',
      children: () => Route({
        path: '/about',
        component: About,
      })
    })

    const { html: output } = renderToString(App)

    expect(output).toBe('')
  })

  test('query string é parseada corretamente', () => {
    const Search = () => {
      const query = router.query.get()
      return `Query: q=${query.get('q')}, page=${query.get('page')}`
    }

    const App = () => Router({
      location: '/search?q=test&page=2',
      children: () => Route({
        path: '/search',
        component: Search,
      })
    })

    const { html: output } = renderToString(App)

    expect(output).toContain('Query: q=test, page=2')
  })

  test('wildcard captura segmentos restantes', () => {
    const Files = ({ params }: { params: Record<string, string> }) => `File: ${params['*']}`

    const App = () => Router({
      location: '/files/docs/report.pdf',
      children: () => Route({
        path: '/files/*',
        component: Files,
      })
    })

    const { html: output } = renderToString(App)

    expect(output).toContain('File: docs/report.pdf')
  })

  test('rotas aninhadas compartilham layout', () => {
    const Layout = ({ params }: { params: { section: string } }) => `Section: ${params.section}`

    const App = () => Router({
      location: '/dashboard/settings',
      children: () => Route({
        path: '/dashboard/:section',
        component: Layout,
      })
    })

    const { html: output } = renderToString(App)

    expect(output).toContain('Section: settings')
  })

  test('múltiplas rotas funcionam', () => {
    const Home = () => 'Home'
    const About = () => 'About'

    const App = () => Router({
      location: '/',
      children: () => {
        const route1 = Route({ path: '/', component: Home })
        const route2 = Route({ path: '/about', component: About })
        return [route1, route2].filter(Boolean)
      }
    })

    const { html: output } = renderToString(App)

    expect(output).toContain('Home')
  })
})

describe('Router Integration - Data Loaders (SSR)', () => {
  beforeEach(() => {
    router._setState({
      pathname: '/',
      params: {},
      search: '',
      isNavigating: false,
    })
    clearLoaderCache()
  })

  test('loader síncrono executa em SSR e renderiza dados', () => {
    const loader = (params: { id: string }) => {
      return { name: 'John Doe', userId: params.id }
    }

    const User = ({ params, loaderState }: any) => {
      const data = loaderState?.data.get()
      return `User ${params.id}: ${data?.name}`
    }

    const App = () => Router({
      location: '/users/123',
      children: () => Route({
        path: '/users/:id',
        component: User,
        loader,
      })
    })

    const { html: output } = renderToString(App)

    expect(output).toContain('User 123: John Doe')
  })

  test('loader recebe query params em SSR', () => {
    const loader = (_params: Record<string, string>, query: URLSearchParams) => {
      return {
        searchTerm: query.get('q'),
        page: query.get('page'),
      }
    }

    const Search = ({ loaderState }: any) => {
      const data = loaderState?.data.get()
      return `Search: q=${data?.searchTerm}, page=${data?.page}`
    }

    const App = () => Router({
      location: '/search?q=typescript&page=1',
      children: () => Route({
        path: '/search',
        component: Search,
        loader,
      })
    })

    const { html: output } = renderToString(App)

    expect(output).toContain('Search: q=typescript, page=1')
  })

  test('loader assíncrono mostra loading state inicial em SSR', () => {
    const loader = async (params: { id: string }) => {
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 10))
      return { title: 'My Post', postId: params.id }
    }

    const Post = ({ params, loaderState }: any) => {
      return `Post ${params.id}: loading=${loaderState?.loading.get()}`
    }

    const App = () => Router({
      location: '/posts/456',
      children: () => Route({
        path: '/posts/:id',
        component: Post,
        loader,
      })
    })

    const { html: output } = renderToString(App)

    expect(output).toContain('Post 456: loading=true')
  })

  test('cache de loader funciona entre múltiplas renderizações', () => {
    let callCount = 0
    const loader = (params: { id: string }) => {
      callCount++
      return { name: 'Jane', userId: params.id }
    }

    const User = ({ params, loaderState }: any) => {
      const data = loaderState?.data.get()
      return `User ${params.id}: ${data?.name}`
    }

    // Primeira renderização
    const App1 = () => Router({
      location: '/users/789',
      children: () => Route({
        path: '/users/:id',
        component: User,
        loader,
      })
    })

    renderToString(App1)

    // Segunda renderização (deve usar cache)
    const App2 = () => Router({
      location: '/users/789',
      children: () => Route({
        path: '/users/:id',
        component: User,
        loader,
      })
    })

    renderToString(App2)

    expect(callCount).toBe(1)
  })

  test('loader não executa quando rota não match', () => {
    let loaderExecuted = false
    const loader = () => {
      loaderExecuted = true
      return { data: 'test' }
    }

    const About = () => 'About Page'

    const App = () => Router({
      location: '/',
      children: () => Route({
        path: '/about',
        component: About,
        loader,
      })
    })

    renderToString(App)

    expect(loaderExecuted).toBe(false)
  })

  test('loaders diferentes para params diferentes', () => {
    let callCount = 0
    const loader = (params: { id: string }) => {
      callCount++
      return { userId: params.id }
    }

    const User = ({ params, loaderState }: any) => {
      const data = loaderState?.data.get()
      return `User ${params.id}: ${data?.userId}`
    }

    // Primeira renderização com id=1
    const App1 = () => Router({
      location: '/users/1',
      children: () => Route({
        path: '/users/:id',
        component: User,
        loader,
      })
    })

    const output1 = renderToString(App1)

    // Segunda renderização com id=2 (deve re-executar loader)
    const App2 = () => Router({
      location: '/users/2',
      children: () => Route({
        path: '/users/:id',
        component: User,
        loader,
      })
    })

    const output2 = renderToString(App2)

    expect(callCount).toBe(2)
    expect(output1.html).toContain('User 1: 1')
    expect(output2.html).toContain('User 2: 2')
  })
})
