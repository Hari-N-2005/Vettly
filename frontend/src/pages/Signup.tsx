import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import BackendSleepNotice from '@/components/common/BackendSleepNotice'

export function Signup() {
  const navigate = useNavigate()
  const { signup, isLoading, error } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!name || !email || !password || !confirmPassword) {
      setLocalError('All fields are required')
      return
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }

    try {
      await signup(email, password, name)
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
            <div className="text-5xl font-bold bg-gradient-to-r from-legal-accent to-legal-gold bg-clip-text text-transparent mb-2">
              ⚖️
            </div>
            <h1 className="text-3xl font-bold text-gray-100 mb-1">Vettly</h1>
            <p className="text-sm text-gray-400">Tender Compliance Validator</p>
          </div>

          <p className="text-gray-300 mb-6 text-center">Create your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || localError) && (
              <div className="p-4 bg-red-950 border border-red-700 rounded-lg">
                <p className="text-sm text-red-300">{error || localError}</p>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2 bg-legal-dark border border-legal-blue border-opacity-50 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-legal-accent focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>

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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-legal-accent hover:text-legal-gold font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <BackendSleepNotice isActive={isLoading} />
    </div>
  )
}
