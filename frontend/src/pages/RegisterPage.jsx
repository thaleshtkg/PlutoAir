import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../api/services'
import { useAuthStore } from '../store/authStore'

function getPasswordStrength(password) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (password.length >= 12) score++
  if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: '25%' }
  if (score === 2) return { label: 'Fair', color: 'bg-orange-400', width: '50%' }
  if (score === 3) return { label: 'Strong', color: 'bg-yellow-400', width: '75%' }
  return { label: 'Very Strong', color: 'bg-green-500', width: '100%' }
}

function FieldStatus({ touched, error, value }) {
  if (!touched || !value) return null
  if (error) return <span className="text-red-600 text-xs ml-1">✕</span>
  return <span className="text-green-600 text-xs ml-1">✓</span>
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [form, setForm] = useState({
    full_name: '', email: '', mobile: '', password: '', confirm_password: '', terms: false,
  })
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const validate = (name, value, allValues = form) => {
    switch (name) {
      case 'full_name':
        if (!value.trim()) return 'Full name is required'
        if (value.trim().length < 2) return 'Name must be at least 2 characters'
        if (value.trim().length > 100) return 'Name must be under 100 characters'
        if (!/^[A-Za-z\s\-]+$/.test(value.trim())) return 'Name can only contain letters, spaces, and hyphens'
        return ''
      case 'email':
        if (!value.trim()) return 'Email address is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address'
        return ''
      case 'mobile':
        if (!value.trim()) return 'Mobile number is required'
        if (!/^[0-9]{10}$/.test(value.replace(/\s/g, ''))) return 'Please enter a valid 10-digit mobile number'
        return ''
      case 'password':
        if (!value) return 'Password is required'
        if (value.length < 8) return 'Password must be at least 8 characters'
        if (!/[A-Z]/.test(value)) return 'Password must contain at least 1 uppercase letter'
        if (!/[0-9]/.test(value)) return 'Password must contain at least 1 digit'
        if (!/[^A-Za-z0-9]/.test(value)) return 'Password must contain at least 1 special character'
        return ''
      case 'confirm_password':
        if (!value) return 'Please confirm your password'
        if (value !== allValues.password) return 'Passwords do not match.'
        return ''
      case 'terms':
        if (!value) return 'You must accept the terms to continue'
        return ''
      default:
        return ''
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    const newForm = { ...form, [name]: newValue }
    setForm(newForm)
    setServerError('')
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validate(name, newValue, newForm) }))
    }
    // Live confirm password check
    if (name === 'password' && touched.confirm_password) {
      setErrors((prev) => ({ ...prev, confirm_password: validate('confirm_password', newForm.confirm_password, newForm) }))
    }
  }

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target
    const val = type === 'checkbox' ? checked : value
    setTouched((prev) => ({ ...prev, [name]: true }))
    setErrors((prev) => ({ ...prev, [name]: validate(name, val) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const allFields = ['full_name', 'email', 'mobile', 'password', 'confirm_password', 'terms']
    const allTouched = Object.fromEntries(allFields.map(f => [f, true]))
    const allErrors = Object.fromEntries(allFields.map(f => [f, validate(f, form[f])]))
    setTouched(allTouched)
    setErrors(allErrors)
    if (Object.values(allErrors).some(Boolean)) {
      const firstErrorField = allFields.find(f => allErrors[f])
      document.querySelector(`[name="${firstErrorField}"]`)?.focus()
      return
    }
    setLoading(true)
    setServerError('')
    try {
      await authAPI.register({ full_name: form.full_name, email: form.email, mobile: form.mobile, password: form.password })
      await login(form.email, form.password)
      navigate('/search')
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Registration failed. Please try again in a moment.'
      if (msg.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: 'An account with this email already exists. Try logging in instead.' }))
        setTouched(prev => ({ ...prev, email: true }))
      } else {
        setServerError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const strength = form.password ? getPasswordStrength(form.password) : null

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="card-lg max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">✈️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join us and start your journey today</p>
        </div>

        <form data-testid="register-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <FieldStatus touched={touched.full_name} error={errors.full_name} value={form.full_name} />
            </label>
            <input
              data-testid="register-fullname-input"
              id="full_name" name="full_name" type="text"
              value={form.full_name}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="Enter your full name"
              className={`w-full ${touched.full_name && errors.full_name ? 'input-error' : touched.full_name && form.full_name ? 'input-success' : ''}`}
            />
            {touched.full_name && errors.full_name && (
              <p data-testid="register-fullname-error" className="error-text mt-1">✕ {errors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <FieldStatus touched={touched.email} error={errors.email} value={form.email} />
            </label>
            <input
              data-testid="register-email-input"
              id="email" name="email" type="email"
              value={form.email}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="Enter your email address"
              className={`w-full ${touched.email && errors.email ? 'input-error' : touched.email && form.email ? 'input-success' : ''}`}
            />
            {touched.email && errors.email && (
              <p data-testid="register-email-error" className="error-text mt-1">✕ {errors.email}</p>
            )}
          </div>

          {/* Mobile */}
          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number <FieldStatus touched={touched.mobile} error={errors.mobile} value={form.mobile} />
            </label>
            <input
              data-testid="register-mobile-input"
              id="mobile" name="mobile" type="tel"
              value={form.mobile}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="10-digit mobile number"
              maxLength={10}
              className={`w-full ${touched.mobile && errors.mobile ? 'input-error' : touched.mobile && form.mobile ? 'input-success' : ''}`}
            />
            {touched.mobile && errors.mobile && (
              <p data-testid="register-mobile-error" className="error-text mt-1">✕ {errors.mobile}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password <FieldStatus touched={touched.password} error={errors.password} value={form.password} />
            </label>
            <div className="relative">
              <input
                data-testid="register-password-input"
                id="password" name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="Min 8 chars, uppercase, digit, symbol"
                className={`w-full pr-10 ${touched.password && errors.password ? 'input-error' : touched.password && form.password ? 'input-success' : ''}`}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label="Toggle password visibility">
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {/* Password Strength Meter */}
            {form.password && (
              <div className="mt-2">
                <div className="progress-bar h-2">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Strength: <span className="font-semibold">{strength.label}</span></p>
              </div>
            )}
            {touched.password && errors.password && (
              <p data-testid="register-password-error" className="error-text mt-1">✕ {errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <FieldStatus touched={touched.confirm_password} error={errors.confirm_password} value={form.confirm_password} />
            </label>
            <div className="relative">
              <input
                data-testid="register-confirm-password-input"
                id="confirm_password" name="confirm_password"
                type={showConfirm ? 'text' : 'password'}
                value={form.confirm_password}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="Re-enter your password"
                className={`w-full pr-10 ${touched.confirm_password && errors.confirm_password ? 'input-error' : touched.confirm_password && form.confirm_password ? 'input-success' : ''}`}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label="Toggle confirm password visibility">
                {showConfirm ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {touched.confirm_password && errors.confirm_password && (
              <p data-testid="register-confirm-error" className="error-text mt-1">✕ {errors.confirm_password}</p>
            )}
          </div>

          {/* Terms */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                data-testid="register-terms-checkbox"
                id="terms" name="terms" type="checkbox"
                checked={form.terms}
                onChange={handleChange} onBlur={handleBlur}
                className="w-4 h-4 mt-0.5 flex-shrink-0"
              />
              <span className="text-sm text-gray-700">
                I agree to the{' '}
                <a href="#" className="text-primary-600 hover:underline font-medium">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary-600 hover:underline font-medium">Privacy Policy</a>
              </span>
            </label>
            {touched.terms && errors.terms && (
              <p data-testid="register-terms-error" className="error-text mt-1">✕ {errors.terms}</p>
            )}
          </div>

          {/* Server Error */}
          {serverError && (
            <div data-testid="register-server-error" className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              ✕ {serverError}
            </div>
          )}

          {/* Submit */}
          <button
            data-testid="register-submit-button"
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-base py-3"
          >
            {loading ? '⏳ Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link data-testid="register-login-link" to="/login" className="text-primary-600 font-semibold hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
