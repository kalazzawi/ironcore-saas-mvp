import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Server, Globe, Plus, BarChart3, Pin, PinOff, Network, ChevronDown, ChevronRight, Menu } from 'lucide-react'
import { LandingPage } from './components/LandingPage'
import { RegisterForm } from './components/RegisterForm'

interface IPAMScope {
  id: string
  name: string
  description?: string
  scope_type: string
  is_default: boolean
  created_at: string
}

interface IPAMPool {
  id: string
  scope_id: string
  name: string
  description?: string
  cidr_block: string
  region?: string
  environment?: string
  created_at: string
}

interface IPAMAllocation {
  id: string
  pool_id: string
  cidr_block: string
  resource_type: string
  resource_name?: string
  description?: string
  status: string
  created_at: string
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [scopes, setScopes] = useState<IPAMScope[]>([])
  const [pools, setPools] = useState<IPAMPool[]>([])
  const [allocations, setAllocations] = useState<IPAMAllocation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarPinned, setSidebarPinned] = useState(true)
  const [ipamExpanded, setIpamExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'register' | 'app'>('landing')

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json()
  }

  const handleLogin = async (email: string, password: string, tenant: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          tenant
        }),
      })

      setToken(response.access_token)
      setIsAuthenticated(true)
      localStorage.setItem('token', response.access_token)
      
      const userResponse = await apiCall('/users/me', {
        headers: { Authorization: `Bearer ${response.access_token}` }
      })
      setCurrentUser(userResponse)
      setCurrentPage('app')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (email: string, password: string, fullName: string, accountType: string, tenant?: string, organizationName?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          account_type: accountType,
          tenant: tenant || undefined,
          organization_name: organizationName || undefined,
        }),
      })

      const loginTenant = accountType === 'personal' ? organizationName : tenant
      await handleLogin(email, password, loginTenant!)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      const [scopesData, poolsData, allocationsData] = await Promise.all([
        apiCall('/ipam/scopes/'),
        apiCall('/ipam/pools/'),
        apiCall('/ipam/allocations/')
      ])
      
      setScopes(scopesData)
      setPools(poolsData)
      setAllocations(allocationsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && token) {
      loadData()
    }
  }, [isAuthenticated, token])

  useEffect(() => {
    if (['scopes', 'pools', 'allocations'].includes(activeView)) {
      setIpamExpanded(true)
    }
  }, [activeView])

  if (!isAuthenticated) {
    if (currentPage === 'landing') {
      return (
        <LandingPage
          onSignIn={() => setCurrentPage('login')}
          onRegister={() => setCurrentPage('register')}
        />
      )
    }
    
    if (currentPage === 'register') {
      return (
        <RegisterForm
          onRegister={handleRegister}
          onBackToLanding={() => setCurrentPage('landing')}
          onSwitchToLogin={() => setCurrentPage('login')}
          loading={loading}
          error={error}
        />
      )
    }
    
    return (
      <LoginForm
        onLogin={handleLogin}
        onBackToLanding={() => setCurrentPage('landing')}
        onSwitchToRegister={() => setCurrentPage('register')}
        loading={loading}
        error={error}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Full-width header */}
      <header className="bg-white shadow-sm border-b w-full">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">IroncoreAI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {currentUser?.full_name || currentUser?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAuthenticated(false)
                  setToken(null)
                  setCurrentUser(null)
                  setCurrentPage('landing')
                  localStorage.removeItem('token')
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex flex-1">
        {/* Collapsible sidebar */}
        <div
          className={`bg-white border-r transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-16'
          }`}
          onMouseEnter={() => {
            if (!sidebarPinned && !sidebarOpen) {
              setSidebarOpen(true)
            }
          }}
          onMouseLeave={() => {
            if (!sidebarPinned && sidebarOpen) {
              setSidebarOpen(false)
            }
          }}
        >
          <div className="p-4">
            {/* Navigation menu */}
            <nav className="space-y-2">
              {/* Hamburger/Pin toggle - First item in navigation */}
              <Button
                variant="ghost"
                className={`w-full ${sidebarOpen ? 'justify-start' : 'justify-center px-2'}`}
                onClick={() => {
                  if (sidebarOpen) {
                    setSidebarPinned(!sidebarPinned)
                  } else {
                    setSidebarOpen(true)
                  }
                }}
              >
                {sidebarOpen ? (
                  sidebarPinned ? (
                    <Pin className="h-4 w-4" />
                  ) : (
                    <PinOff className="h-4 w-4" />
                  )
                ) : (
                  <Menu className="h-4 w-4" />
                )}
                {sidebarOpen && (
                  <span className="ml-2">
                    {sidebarPinned ? 'Unpin' : 'Pin'}
                  </span>
                )}
              </Button>

              {/* Dashboard - Top level */}
              <Button
                variant={activeView === 'dashboard' ? 'default' : 'ghost'}
                className={`w-full ${sidebarOpen ? 'justify-start' : 'justify-center px-2'}`}
                onClick={() => setActiveView('dashboard')}
              >
                <BarChart3 className="h-4 w-4" />
                {sidebarOpen && <span className="ml-2">Dashboard</span>}
              </Button>

              {/* IPAM - Main section with sub-navigation */}
              <div className="space-y-1">
                <Button
                  variant={['scopes', 'pools', 'allocations'].includes(activeView) ? 'default' : 'ghost'}
                  className={`w-full ${sidebarOpen ? 'justify-start' : 'justify-center px-2'}`}
                  onClick={() => {
                    setIpamExpanded(!ipamExpanded)
                    if (!ipamExpanded && !['scopes', 'pools', 'allocations'].includes(activeView)) {
                      setActiveView('scopes')
                    }
                  }}
                >
                  <Network className="h-4 w-4" />
                  {sidebarOpen && (
                    <>
                      <span className="ml-2">IPAM</span>
                      {ipamExpanded ? (
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      ) : (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </>
                  )}
                </Button>

                {/* IPAM Sub-navigation - only show when expanded and sidebar is open */}
                {sidebarOpen && ipamExpanded && (
                  <div className="ml-6 space-y-1">
                    <Button
                      variant={activeView === 'scopes' ? 'default' : 'ghost'}
                      className="w-full justify-start text-sm"
                      onClick={() => setActiveView('scopes')}
                    >
                      Scopes
                    </Button>
                    <Button
                      variant={activeView === 'pools' ? 'default' : 'ghost'}
                      className="w-full justify-start text-sm"
                      onClick={() => setActiveView('pools')}
                    >
                      Pools
                    </Button>
                    <Button
                      variant={activeView === 'allocations' ? 'default' : 'ghost'}
                      className="w-full justify-start text-sm"
                      onClick={() => setActiveView('allocations')}
                    >
                      Allocations
                    </Button>
                  </div>
                )}
              </div>

              {/* Administration - Only show for admin users */}
              {currentUser?.is_tenant_admin && (
                <Button
                  variant={activeView === 'admin' ? 'default' : 'ghost'}
                  className={`w-full ${sidebarOpen ? 'justify-start' : 'justify-center px-2'}`}
                  onClick={() => setActiveView('admin')}
                >
                  <Server className="h-4 w-4" />
                  {sidebarOpen && <span className="ml-2">Administration</span>}
                </Button>
              )}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 p-8">
          {error && (
            <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-800">
              <AlertDescription className="text-amber-800 font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {activeView === 'dashboard' && (
            <DashboardView scopes={scopes} pools={pools} allocations={allocations} />
          )}
          {activeView === 'scopes' && (
            <ScopesView scopes={scopes} onRefresh={loadData} apiCall={apiCall} />
          )}
          {activeView === 'pools' && (
            <PoolsView pools={pools} scopes={scopes} onRefresh={loadData} apiCall={apiCall} />
          )}
          {activeView === 'allocations' && (
            <AllocationsView allocations={allocations} pools={pools} onRefresh={loadData} apiCall={apiCall} />
          )}
          {activeView === 'admin' && currentUser?.is_tenant_admin && (
            <AdminDashboard currentUser={currentUser} />
          )}
        </main>
      </div>
    </div>
  )
}

function LoginForm({ onLogin, onBackToLanding, onSwitchToRegister, loading, error }: { 
  onLogin: (email: string, password: string, tenant: string) => void
  onBackToLanding: () => void
  onSwitchToRegister: () => void
  loading: boolean
  error: string | null 
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tenant, setTenant] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(email, password, tenant)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">IroncoreAI</h1>
          </div>
          <Button variant="ghost" onClick={onBackToLanding} className="text-sm">
            ← Back to Home
          </Button>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>Access your IroncoreAI dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>
              <div>
                <Label htmlFor="tenant">Tenant</Label>
                <Input
                  id="tenant"
                  value={tenant}
                  onChange={(e) => setTenant(e.target.value)}
                  required
                  placeholder="Enter your organization name"
                />
              </div>
              {error && (
                <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                  <AlertDescription className="text-amber-800 font-medium">{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
              <div className="mt-6 text-center">
                <span className="text-sm text-gray-600">Don't have an account? </span>
                <Button variant="link" onClick={onSwitchToRegister} className="text-sm p-0">
                  Sign up
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DashboardView({ scopes, pools, allocations }: {
  scopes: IPAMScope[]
  pools: IPAMPool[]
  allocations: IPAMAllocation[]
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">IPAM Scopes</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{scopes.length}</div>
          <p className="text-xs text-muted-foreground">
            {scopes.filter(s => s.scope_type === 'public').length} public, {scopes.filter(s => s.scope_type === 'private').length} private
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">IP Pools</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pools.length}</div>
          <p className="text-xs text-muted-foreground">
            Across {new Set(pools.map(p => p.region)).size} regions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Allocations</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{allocations.length}</div>
          <p className="text-xs text-muted-foreground">
            {allocations.filter(a => a.status === 'allocated').length} active
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function ScopesView({ scopes, onRefresh, apiCall }: {
  scopes: IPAMScope[]
  onRefresh: () => void
  apiCall: (endpoint: string, options?: RequestInit) => Promise<any>
}) {
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">IPAM Scopes</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Scope
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scopes.map((scope) => (
          <Card key={scope.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{scope.name}</CardTitle>
                <Badge variant={scope.scope_type === 'public' ? 'default' : 'secondary'}>
                  {scope.scope_type}
                </Badge>
              </div>
              {scope.description && (
                <CardDescription>{scope.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                Created: {new Date(scope.created_at).toLocaleDateString()}
              </div>
              {scope.is_default && (
                <Badge variant="outline" className="mt-2">Default</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {showCreateForm && (
        <CreateScopeForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            onRefresh()
          }}
          apiCall={apiCall}
        />
      )}
    </div>
  )
}

function PoolsView({ pools, scopes, onRefresh, apiCall }: {
  pools: IPAMPool[]
  scopes: IPAMScope[]
  onRefresh: () => void
  apiCall: (endpoint: string, options?: RequestInit) => Promise<any>
}) {
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">IP Pools</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Pool
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pools.map((pool) => (
          <Card key={pool.id}>
            <CardHeader>
              <CardTitle className="text-lg">{pool.name}</CardTitle>
              {pool.description && (
                <CardDescription>{pool.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                {pool.cidr_block}
              </div>
              {pool.region && (
                <div className="text-sm text-gray-600">Region: {pool.region}</div>
              )}
              {pool.environment && (
                <Badge variant="outline">{pool.environment}</Badge>
              )}
              <div className="text-sm text-gray-600">
                Created: {new Date(pool.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showCreateForm && (
        <CreatePoolForm
          scopes={scopes}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            onRefresh()
          }}
          apiCall={apiCall}
        />
      )}
    </div>
  )
}

function AllocationsView({ allocations, pools, onRefresh, apiCall }: {
  allocations: IPAMAllocation[]
  pools: IPAMPool[]
  onRefresh: () => void
  apiCall: (endpoint: string, options?: RequestInit) => Promise<any>
}) {
  const [showCreateForm, setShowCreateForm] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">IP Allocations</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Allocation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allocations.map((allocation) => (
          <Card key={allocation.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {allocation.resource_name || allocation.resource_type}
                </CardTitle>
                <Badge variant={allocation.status === 'allocated' ? 'default' : 'secondary'}>
                  {allocation.status}
                </Badge>
              </div>
              {allocation.description && (
                <CardDescription>{allocation.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                {allocation.cidr_block}
              </div>
              <div className="text-sm text-gray-600">
                Type: {allocation.resource_type}
              </div>
              <div className="text-sm text-gray-600">
                Created: {new Date(allocation.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showCreateForm && (
        <CreateAllocationForm
          pools={pools}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            onRefresh()
          }}
          apiCall={apiCall}
        />
      )}
    </div>
  )
}

function CreateScopeForm({ onClose, onSuccess, apiCall }: {
  onClose: () => void
  onSuccess: () => void
  apiCall: (endpoint: string, options?: RequestInit) => Promise<any>
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scopeType, setScopeType] = useState('private')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await apiCall('/ipam/scopes/', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          scope_type: scopeType,
          is_default: false
        })
      })
      onSuccess()
    } catch (err) {
      console.error('Failed to create scope:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create IPAM Scope</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="scopeType">Scope Type</Label>
            <select
              id="scopeType"
              value={scopeType}
              onChange={(e) => setScopeType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function CreatePoolForm({ scopes, onClose, onSuccess, apiCall }: {
  scopes: IPAMScope[]
  onClose: () => void
  onSuccess: () => void
  apiCall: (endpoint: string, options?: RequestInit) => Promise<any>
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scopeId, setScopeId] = useState('')
  const [cidrBlock, setCidrBlock] = useState('')
  const [region, setRegion] = useState('')
  const [environment, setEnvironment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await apiCall('/ipam/pools/', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          scope_id: scopeId,
          cidr_block: cidrBlock,
          region,
          environment
        })
      })
      onSuccess()
    } catch (err) {
      console.error('Failed to create pool:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create IP Pool</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="scopeId">Scope</Label>
            <select
              id="scopeId"
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select a scope</option>
              {scopes.map((scope) => (
                <option key={scope.id} value={scope.id}>
                  {scope.name} ({scope.scope_type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="cidrBlock">CIDR Block</Label>
            <Input
              id="cidrBlock"
              value={cidrBlock}
              onChange={(e) => setCidrBlock(e.target.value)}
              placeholder="10.0.0.0/16"
              required
            />
          </div>
          <div>
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="us-east-1"
            />
          </div>
          <div>
            <Label htmlFor="environment">Environment</Label>
            <select
              id="environment"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select environment</option>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function CreateAllocationForm({ pools, onClose, onSuccess, apiCall }: {
  pools: IPAMPool[]
  onClose: () => void
  onSuccess: () => void
  apiCall: (endpoint: string, options?: RequestInit) => Promise<any>
}) {
  const [poolId, setPoolId] = useState('')
  const [cidrBlock, setCidrBlock] = useState('')
  const [resourceType, setResourceType] = useState('vpc')
  const [resourceName, setResourceName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await apiCall('/ipam/allocations/', {
        method: 'POST',
        body: JSON.stringify({
          pool_id: poolId,
          cidr_block: cidrBlock,
          resource_type: resourceType,
          resource_name: resourceName,
          description
        })
      })
      onSuccess()
    } catch (err) {
      console.error('Failed to create allocation:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create IP Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="poolId">Pool</Label>
            <select
              id="poolId"
              value={poolId}
              onChange={(e) => setPoolId(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select a pool</option>
              {pools.map((pool) => (
                <option key={pool.id} value={pool.id}>
                  {pool.name} ({pool.cidr_block})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="cidrBlock">CIDR Block</Label>
            <Input
              id="cidrBlock"
              value={cidrBlock}
              onChange={(e) => setCidrBlock(e.target.value)}
              placeholder="10.0.1.0/24"
              required
            />
          </div>
          <div>
            <Label htmlFor="resourceType">Resource Type</Label>
            <select
              id="resourceType"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="vpc">VPC</option>
              <option value="subnet">Subnet</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div>
            <Label htmlFor="resourceName">Resource Name</Label>
            <Input
              id="resourceName"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              placeholder="my-vpc-prod"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>


          <div className="flex space-x-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default App

function AdminDashboard({ currentUser }: { currentUser: any }) {
  useEffect(() => {
    if (currentUser?.is_tenant_admin) {
      loadAdminData()
    }
  }, [currentUser])
  
  const loadAdminData = async () => {
    try {
      console.log('Loading admin data...')
    } catch (err) {
      console.error('Failed to load admin data:', err)
    }
  }
  
  if (!currentUser?.is_tenant_admin) {
    return null
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Administration</h2>
        <p className="text-gray-600">Manage your organization's settings and users</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Tenant Management</span>
            </CardTitle>
            <CardDescription>
              Manage tenant settings, subscriptions, and billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Current Tenant:</span>
                <Badge variant="secondary">IroncoreAI</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Subscription:</span>
                <Badge variant="outline">Enterprise</Badge>
              </div>
              <Button variant="outline" className="w-full">
                Manage Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>User Management</span>
            </CardTitle>
            <CardDescription>
              Manage users, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active Users:</span>
                <Badge variant="secondary">1</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Admin Users:</span>
                <Badge variant="secondary">1</Badge>
              </div>
              <Button variant="outline" className="w-full">
                Manage Users
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current system status and information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{currentUser.email}</div>
              <div className="text-sm text-gray-600">Admin Email</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Active</div>
              <div className="text-sm text-gray-600">Account Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">Full Access</div>
              <div className="text-sm text-gray-600">Permission Level</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
