import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Brain } from 'lucide-react'

interface RegisterFormProps {
  onRegister: (email: string, password: string, fullName: string, accountType: string, tenant?: string, organizationName?: string) => Promise<void>
  onBackToLanding: () => void
  onSwitchToLogin: () => void
  loading?: boolean
  error?: string | null
}

export function RegisterForm({ onRegister, onBackToLanding, onSwitchToLogin, loading, error }: RegisterFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [accountType, setAccountType] = useState('personal')
  const [tenant, setTenant] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')
    
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match')
      return
    }
    
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long')
      return
    }
    
    if (!fullName.trim()) {
      setValidationError('Full name is required')
      return
    }
    
    if (accountType === 'personal' && !organizationName.trim()) {
      setValidationError('Organization name is required for personal accounts')
      return
    }
    
    if (accountType === 'existing' && !tenant.trim()) {
      setValidationError('Tenant name is required to join existing organization')
      return
    }

    setIsLoading(true)
    try {
      await onRegister(email, password, fullName.trim(), accountType, tenant.trim() || undefined, organizationName.trim() || undefined)
    } finally {
      setIsLoading(false)
    }
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

        <Card>
          <CardHeader>
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>
              Join IroncoreAI and start transforming your IT operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(error || validationError) && (
                <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                  <AlertDescription className="text-amber-800 font-medium">
                    {error || validationError}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
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
              
              <div className="space-y-2">
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
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Account Type</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="personal"
                        name="accountType"
                        value="personal"
                        checked={accountType === 'personal'}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <Label htmlFor="personal" className="text-sm font-normal cursor-pointer">
                        Create a personal account (I'll manage my own organization)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="existing"
                        name="accountType"
                        value="existing"
                        checked={accountType === 'existing'}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <Label htmlFor="existing" className="text-sm font-normal cursor-pointer">
                        Join an existing organization
                      </Label>
                    </div>
                  </div>
                </div>

                {accountType === 'personal' && (
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Organization Name</Label>
                    <Input
                      id="organizationName"
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      required
                      placeholder="Enter your organization name"
                    />
                  </div>
                )}

                {accountType === 'existing' && (
                  <div className="space-y-2">
                    <Label htmlFor="tenant">Organization Name</Label>
                    <Input
                      id="tenant"
                      type="text"
                      value={tenant}
                      onChange={(e) => setTenant(e.target.value)}
                      required
                      placeholder="Enter existing organization name"
                    />
                  </div>
                )}
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading || loading}>
                {(isLoading || loading) ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-600">Already have an account? </span>
              <Button variant="link" onClick={onSwitchToLogin} className="text-sm p-0">
                Sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
