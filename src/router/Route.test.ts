import { describe, test, expect, beforeEach } from 'bun:test'
import { Route, clearGuardCache } from './Route'
import { router } from './state'
import { clearLoaderCache } from './loaders'

describe('Route Component', () => {
  beforeEach(() => {
    // Reset router state
    router._setState({
      pathname: '/',
      params: {},
      search: '',
      isNavigating: false,
    })
    clearLoaderCache()
    clearGuardCache()
  })

  test('renderiza component quando match', () => {
    router._setState({ pathname: '/about' })

    const AboutComponent = () => 'About Page'

    const result = Route({
      path: '/about',
      component: AboutComponent,
    })

    expect(result).toBe('About Page')
  })

  test('não renderiza quando não match', () => {
    router._setState({ pathname: '/contact' })

    const AboutComponent = () => 'About Page'

    const result = Route({
      path: '/about',
      component: AboutComponent,
    })

    expect(result).toBeNull()
  })

  test('extrai params e passa para component', () => {
    router._setState({ pathname: '/users/123' })

    const UserComponent = ({ params }: { params: { id: string } }) => {
      return `User ID: ${params.id}`
    }

    const result = Route({
      path: '/users/:id',
      component: UserComponent,
    })

    expect(result).toBe('User ID: 123')
  })

  test('extrai múltiplos params', () => {
    router._setState({ pathname: '/users/456/profile' })

    const UserTabComponent = ({ params }: { params: { id: string; tab: string } }) => {
      return `User ${params.id} - Tab: ${params.tab}`
    }

    const result = Route({
      path: '/users/:id/:tab',
      component: UserTabComponent,
    })

    expect(result).toBe('User 456 - Tab: profile')
  })

  test('atualiza params no router state', () => {
    router._setState({ pathname: '/posts/my-slug' })

    const PostComponent = () => 'Post'

    Route({
      path: '/posts/:slug',
      component: PostComponent,
    })

    expect(router.params.get()).toEqual({ slug: 'my-slug' })
  })

  test('rota raiz funciona', () => {
    router._setState({ pathname: '/' })

    const HomeComponent = () => 'Home'

    const result = Route({
      path: '/',
      component: HomeComponent,
    })

    expect(result).toBe('Home')
  })

  test('wildcard funciona', () => {
    router._setState({ pathname: '/files/docs/report.pdf' })

    const FileComponent = ({ params }: { params: { '*': string } }) => {
      return `File: ${params['*']}`
    }

    const result = Route({
      path: '/files/*',
      component: FileComponent,
    })

    expect(result).toBe('File: docs/report.pdf')
  })

  test('executa loader síncrono e passa loaderState para component', () => {
    router._setState({ pathname: '/users/123' })

    const loader = (params: { id: string }) => {
      return { name: 'John', userId: params.id }
    }

    const UserComponent = ({ params, loaderState }: any) => {
      if (!loaderState) return 'No loader'
      return `User ${params.id}: ${loaderState.data.get()?.name}`
    }

    const result = Route({
      path: '/users/:id',
      component: UserComponent,
      loader,
    })

    expect(result).toBe('User 123: John')
  })

  test('loaderState contém loading state para loaders assíncronos', () => {
    router._setState({ pathname: '/posts/456' })

    const loader = async (params: { id: string }) => {
      return { title: 'My Post', postId: params.id }
    }

    const PostComponent = ({ params, loaderState }: any) => {
      if (!loaderState) return 'No loader'
      return `Post ${params.id}: loading=${loaderState.loading.get()}`
    }

    const result = Route({
      path: '/posts/:id',
      component: PostComponent,
      loader,
    })

    expect(result).toBe('Post 456: loading=true')
  })

  test('component sem loader não recebe loaderState', () => {
    router._setState({ pathname: '/about' })

    const AboutComponent = ({ loaderState }: any) => {
      return loaderState ? 'Has loader' : 'No loader'
    }

    const result = Route({
      path: '/about',
      component: AboutComponent,
    })

    expect(result).toBe('No loader')
  })

  test('loader recebe query params', () => {
    router._setState({
      pathname: '/search',
      search: '?q=test&page=2',
    })

    const loader = (_params: Record<string, string>, query: URLSearchParams) => {
      return {
        query: query.get('q'),
        page: query.get('page'),
      }
    }

    const SearchComponent = ({ loaderState }: any) => {
      if (!loaderState) return 'No loader'
      const data = loaderState.data.get()
      return `Search: q=${data?.query}, page=${data?.page}`
    }

    const result = Route({
      path: '/search',
      component: SearchComponent,
      loader,
    })

    expect(result).toBe('Search: q=test, page=2')
  })

  describe('Route Guards', () => {
    test('guard retornando true permite acesso', async () => {
      router._setState({ pathname: '/admin' })

      const guard = () => true

      const AdminComponent = () => 'Admin Page'

      // Primeira renderização - guard está executando
      let result = Route({
        path: '/admin',
        component: AdminComponent,
        guard,
      })

      // Guard assíncrono retorna null na primeira renderização
      expect(result).toBeNull()

      // Aguardar guard executar
      await new Promise(resolve => setTimeout(resolve, 50))

      // Segunda renderização - guard já executou
      result = Route({
        path: '/admin',
        component: AdminComponent,
        guard,
      })

      expect(result).toBe('Admin Page')
    })

    test('guard retornando false bloqueia acesso', async () => {
      router._setState({ pathname: '/admin' })

      const guard = () => false

      const AdminComponent = () => 'Admin Page'

      // Primeira renderização
      let result = Route({
        path: '/admin',
        component: AdminComponent,
        guard,
      })

      expect(result).toBeNull()

      // Aguardar guard executar
      await new Promise(resolve => setTimeout(resolve, 50))

      // Segunda renderização - guard bloqueou
      result = Route({
        path: '/admin',
        component: AdminComponent,
        guard,
      })

      expect(result).toBeNull()
    })

    test('guard retornando string bloqueia acesso', async () => {
      router._setState({ pathname: '/admin' })

      const guard = () => '/login'

      const AdminComponent = () => 'Admin Page'

      // Primeira renderização
      let result = Route({
        path: '/admin',
        component: AdminComponent,
        guard,
      })

      expect(result).toBeNull()

      // Aguardar guard executar
      await new Promise(resolve => setTimeout(resolve, 50))

      // Segunda renderização - guard retornou string (redirect), deve bloquear
      result = Route({
        path: '/admin',
        component: AdminComponent,
        guard,
      })

      expect(result).toBeNull()
    })

    test('guard assíncrono retornando true permite acesso', async () => {
      router._setState({ pathname: '/dashboard' })

      const guard = async () => {
        await new Promise(resolve => setTimeout(resolve, 20))
        return true
      }

      const DashboardComponent = () => 'Dashboard'

      // Primeira renderização - guard executando
      let result = Route({
        path: '/dashboard',
        component: DashboardComponent,
        guard,
      })

      expect(result).toBeNull()

      // Aguardar guard executar
      await new Promise(resolve => setTimeout(resolve, 50))

      // Segunda renderização - guard permitiu
      result = Route({
        path: '/dashboard',
        component: DashboardComponent,
        guard,
      })

      expect(result).toBe('Dashboard')
    })

    test('guard recebe params', async () => {
      router._setState({ pathname: '/users/123/edit' })

      let receivedParams: Record<string, string> = {}

      const guard = (params: { id: string }) => {
        receivedParams = params
        return true
      }

      const EditUserComponent = () => 'Edit User'

      Route({
        path: '/users/:id/edit',
        component: EditUserComponent,
        guard,
      })

      // Aguardar guard executar
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(receivedParams).toEqual({ id: '123' })
    })

    test('guard recebe query params', async () => {
      router._setState({
        pathname: '/settings',
        search: '?tab=profile&mode=edit',
      })

      let receivedQuery: URLSearchParams | null = null

      const guard = (_params: Record<string, string>, query: URLSearchParams) => {
        receivedQuery = query
        return true
      }

      const SettingsComponent = () => 'Settings'

      Route({
        path: '/settings',
        component: SettingsComponent,
        guard,
      })

      // Aguardar guard executar
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(receivedQuery?.get('tab')).toBe('profile')
      expect(receivedQuery?.get('mode')).toBe('edit')
    })

    test('guard executa antes do loader', async () => {
      router._setState({ pathname: '/protected' })

      const executionOrder: string[] = []

      const guard = () => {
        executionOrder.push('guard')
        return true
      }

      const loader = () => {
        executionOrder.push('loader')
        return { data: 'test' }
      }

      const ProtectedComponent = () => 'Protected'

      // Primeira renderização - guard executando
      Route({
        path: '/protected',
        component: ProtectedComponent,
        guard,
        loader,
      })

      // Aguardar guard executar
      await new Promise(resolve => setTimeout(resolve, 50))

      // Segunda renderização - guard já executou, loader executa
      Route({
        path: '/protected',
        component: ProtectedComponent,
        guard,
        loader,
      })

      // Guard deve executar primeiro
      expect(executionOrder[0]).toBe('guard')
      expect(executionOrder[1]).toBe('loader')
    })

    test('loader não executa se guard bloquear', async () => {
      router._setState({ pathname: '/admin' })

      let loaderExecuted = false

      const guard = () => false

      const loader = () => {
        loaderExecuted = true
        return { data: 'test' }
      }

      const AdminComponent = () => 'Admin'

      // Primeira renderização
      Route({
        path: '/admin',
        component: AdminComponent,
        guard,
        loader,
      })

      // Aguardar guard executar
      await new Promise(resolve => setTimeout(resolve, 50))

      // Segunda renderização - guard bloqueou, loader não deve executar
      Route({
        path: '/admin',
        component: AdminComponent,
        guard,
        loader,
      })

      expect(loaderExecuted).toBe(false)
    })
  })

  describe('Nested Routes (Outlet)', () => {
    test('passa outlet (children) para component', () => {
      router._setState({ pathname: '/dashboard' })

      const ChildComponent = () => 'Child Content'

      const DashboardComponent = ({ outlet }: { outlet?: any }) => {
        return outlet || 'Dashboard'
      }

      const result = Route({
        path: '/dashboard',
        component: DashboardComponent,
        children: ChildComponent({}),
      })

      expect(result).toBe('Child Content')
    })

    test('component recebe outlet como null se não houver children', () => {
      router._setState({ pathname: '/about' })

      let receivedOutlet: any = undefined

      const AboutComponent = ({ outlet }: { outlet?: any }) => {
        receivedOutlet = outlet
        return 'About'
      }

      Route({
        path: '/about',
        component: AboutComponent,
      })

      expect(receivedOutlet).toBeNull()
    })

    test('outlet pode ser usado para renderizar layouts', () => {
      router._setState({ pathname: '/admin/users' })

      const UsersContent = () => 'Users List'
      const AdminLayout = ({ outlet }: { outlet?: any }) => {
        return `<Layout>${outlet}</Layout>`
      }

      const result = Route({
        path: '/admin/users',
        component: AdminLayout,
        children: UsersContent({}),
      })

      expect(result).toBe('<Layout>Users List</Layout>')
    })
  })

  describe('Transitions', () => {
    test('aplica transição de entrada quando fornecida', async () => {
      router._setState({ pathname: '/home' })

      // Arrange - criar elemento DOM
      const element = document.createElement('div')
      element.textContent = 'Home Content'

      const HomeComponent = () => element

      // Act
      const result = Route({
        path: '/home',
        component: HomeComponent,
        transition: {
          enterClass: 'fade-in',
          duration: 50,
        },
      })

      // Assert - retorna elemento
      expect(result).toBe(element)

      // Assert - classe aplicada durante animação
      expect(element.classList.contains('fade-in')).toBe(true)

      // Wait for transition to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Assert - classe removida após animação
      expect(element.classList.contains('fade-in')).toBe(false)
    })

    test('não aplica transição quando não fornecida', () => {
      router._setState({ pathname: '/about' })

      const element = document.createElement('div')
      element.textContent = 'About Content'

      const AboutComponent = () => element

      const result = Route({
        path: '/about',
        component: AboutComponent,
      })

      expect(result).toBe(element)
      expect(element.className).toBe('')
    })

    test('aplica transição apenas em elementos DOM', () => {
      router._setState({ pathname: '/text' })

      // String não é elemento DOM
      const TextComponent = () => 'Text Content'

      const result = Route({
        path: '/text',
        component: TextComponent,
        transition: {
          enterClass: 'fade-in',
          duration: 50,
        },
      })

      // Assert - retorna string sem erro
      expect(result).toBe('Text Content')
    })

    test('transição funciona com loader', async () => {
      router._setState({ pathname: '/users/123' })

      const element = document.createElement('div')

      const loader = (params: { id: string }) => {
        return { name: 'John', userId: params.id }
      }

      const UserComponent = ({ loaderState }: any) => {
        const data = loaderState?.data.get()
        element.textContent = `User: ${data?.name}`
        return element
      }

      const result = Route({
        path: '/users/:id',
        component: UserComponent,
        loader,
        transition: {
          enterClass: 'slide-in',
          duration: 50,
        },
      })

      // Assert - elemento retornado
      expect(result).toBe(element)

      // Assert - transição aplicada
      expect(element.classList.contains('slide-in')).toBe(true)

      // Wait for transition
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(element.classList.contains('slide-in')).toBe(false)
    })

    test('transição funciona com guard', async () => {
      router._setState({ pathname: '/protected' })

      const element = document.createElement('div')
      element.textContent = 'Protected Content'

      const guard = () => true

      const ProtectedComponent = () => element

      // Primeira renderização - guard executando
      let result = Route({
        path: '/protected',
        component: ProtectedComponent,
        guard,
        transition: {
          enterClass: 'zoom-in',
          duration: 50,
        },
      })

      // Guard executando, retorna null
      expect(result).toBeNull()

      // Aguardar guard
      await new Promise(resolve => setTimeout(resolve, 50))

      // Segunda renderização - guard passou
      result = Route({
        path: '/protected',
        component: ProtectedComponent,
        guard,
        transition: {
          enterClass: 'zoom-in',
          duration: 50,
        },
      })

      // Assert - elemento retornado e transição aplicada
      expect(result).toBe(element)
      expect(element.classList.contains('zoom-in')).toBe(true)

      // Wait for transition
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(element.classList.contains('zoom-in')).toBe(false)
    })

    test('transição customizada com duração longa', async () => {
      router._setState({ pathname: '/slow' })

      const element = document.createElement('div')
      element.textContent = 'Slow Transition'

      const SlowComponent = () => element

      const result = Route({
        path: '/slow',
        component: SlowComponent,
        transition: {
          enterClass: 'fade-in',
          exitClass: 'fade-out',
          duration: 200,
        },
      })

      expect(result).toBe(element)

      // Assert - classe aplicada
      expect(element.classList.contains('fade-in')).toBe(true)

      // Assert - ainda presente após 100ms
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(element.classList.contains('fade-in')).toBe(true)

      // Assert - removida após 250ms
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(element.classList.contains('fade-in')).toBe(false)
    })
  })
})
