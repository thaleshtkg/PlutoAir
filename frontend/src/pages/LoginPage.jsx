import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { authAPI } from '../api/services'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const success = await login(formData.username, formData.password)
      if (success) {
        navigate('/search')
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const useGuestCredentials = () => {
    setFormData({ username: 'admin', password: 'admin@123' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card-lg max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Your journey continues here</p>
        </div>

        {/* Guest Banner */}
        <div
          data-testid="login-guest-banner"
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
        >
          <h3 className="font-semibold text-blue-900 mb-2">🔑 Guest Access</h3>
          <p className="text-sm text-blue-800 mb-3">
            Username: <span className="font-mono font-semibold">admin</span>
          </p>
          <p className="text-sm text-blue-800 mb-4">
            Password: <span className="font-mono font-semibold">admin@123</span>
          </p>
          <button
            data-testid="login-guest-credentials-button"
            type="button"
            onClick={useGuestCredentials}
            className="btn-primary w-full text-sm"
          >
            Use These Credentials
          </button>
          <div data-testid="login-guest-counter" className="text-xs text-blue-600 mt-2 text-center">
            Guest sessions remaining: <span data-testid="login-guest-count-value">20</span> / 20
          </div>
        </div>

        {/* Form */}
        <form data-testid="login-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username or Email
            </label>
            <input
              data-testid="login-username-input"
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              className="w-full"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                data-testid="login-password-input"
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="w-full pr-10"
              />
              <button
                data-testid="login-password-toggle"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label="Toggle password visibility"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              data-testid="login-remember-checkbox"
              id="remember"
              name="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
              Remember me
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div data-testid="login-error-message" className="error-text bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {/* Sign In Button */}
          <button
            data-testid="login-button-signin"
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? '⏳ Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{' '}
          <a
            data-testid="login-link-register"
            href="/register"
            className="text-primary-600 font-semibold hover:underline"
          >
            Register here
          </a>
        </p>
      </div>
    </div>
  )
}
