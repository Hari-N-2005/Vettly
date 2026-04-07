import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import BackendSleepNotice from '@/components/common/BackendSleepNotice'
import Brand from '@/components/common/Brand'

export function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!email || !password) {
      setLocalError('Email and password are required')
      return
    }

    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setLocalError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-legal-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-legal-slate rounded-lg shadow-2xl p-8 border border-legal-blue border-opacity-30">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-2 flex justify-center">
              <Brand
                stacked
                sizeClassName="h-14 w-14"
                textClassName="text-3xl font-bold text-gray-100"
              />
            </div>
            <p className="text-sm text-gray-400">Tender Compliance Validator</p>
          </div>

          <p className="text-gray-300 mb-6 text-center">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || localError) && (
              <div className="p-4 bg-red-950 border border-red-700 rounded-lg">
                <p className="text-sm text-red-300">{error || localError}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 bg-legal-dark border border-legal-blue border-opacity-50 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-legal-accent focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-legal-dark border border-legal-blue border-opacity-50 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-legal-accent focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-legal-accent to-legal-blue text-white font-semibold py-2 rounded-lg hover:shadow-lg disabled:bg-gray-600 transition-all"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-legal-accent hover:text-legal-gold font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <BackendSleepNotice isActive={isLoading} />
    </div>
  )
}
