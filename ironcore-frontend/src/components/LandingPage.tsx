import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Network, Shield, Zap, Users, Globe } from 'lucide-react'

interface LandingPageProps {
  onSignIn: () => void
  onRegister: () => void
}

export function LandingPage({ onSignIn, onRegister }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">IroncoreAI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onSignIn}>
                Sign In
              </Button>
              <Button onClick={onRegister}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              AI-Powered SaaS Platform for
              <span className="text-blue-600"> Enterprise IT</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Unify networking, cloud management, network security, compliance, and risk management 
              into a single enterprise-grade system. Reduce silos, automate tasks, and accelerate compliance.
            </p>
            <div className="flex justify-center space-x-4">
              <Button size="lg" onClick={onRegister}>
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" onClick={onSignIn}>
                Sign In
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Transform Your IT Operations
              </h2>
              <p className="text-lg text-gray-600">
                Cut manual workload by 30-50% and accelerate compliance audits by 70%
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Network className="h-12 w-12 text-blue-600 mb-4" />
                  <CardTitle>IPAM Management</CardTitle>
                  <CardDescription>
                    AWS-style IP Address Management with AI-powered subnet allocation and predictive analytics
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader>
                  <Shield className="h-12 w-12 text-green-600 mb-4" />
                  <CardTitle>Compliance & Risk</CardTitle>
                  <CardDescription>
                    Automated compliance monitoring with AI-driven risk analysis and remediation plans
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader>
                  <Zap className="h-12 w-12 text-yellow-600 mb-4" />
                  <CardTitle>AI Automation</CardTitle>
                  <CardDescription>
                    Intelligent automation that learns from your patterns and suggests optimizations
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Built for Enterprise Scale
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <Users className="h-6 w-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Multi-Tenant Architecture</h3>
                      <p className="text-gray-600">Secure tenant isolation with role-based access control</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Globe className="h-6 w-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Global Scale</h3>
                      <p className="text-gray-600">99.99% SLA uptime with multi-region deployment</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Brain className="h-6 w-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">AI-First Design</h3>
                      <p className="text-gray-600">Built-in AI assistant for predictive insights and automation</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-6">
                  Join thousands of enterprises already using IroncoreAI to streamline their IT operations.
                </p>
                <Button size="lg" className="w-full" onClick={onRegister}>
                  Start Your Free Trial
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="h-6 w-6" />
              <span className="font-semibold">IroncoreAI</span>
            </div>
            <p className="text-gray-400">
              © 2025 IroncoreAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
