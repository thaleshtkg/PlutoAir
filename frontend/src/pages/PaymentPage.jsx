import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { paymentAPI } from '../api/services'
import { useBookingStore } from '../store/bookingStore'
import StepBar from '../components/StepBar'

// Luhn algorithm
function luhn(num) {
  const digits = num.replace(/\D/g, '')
  let sum = 0
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i])
    if ((digits.length - 1 - i) % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  return sum % 10 === 0
}

function detectCard(num) {
  const n = num.replace(/\D/g, '')
  if (/^4/.test(n)) return 'Visa'
  if (/^5[1-5]/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'Amex'
  if (/^6[0-9]/.test(n)) return 'RuPay'
  return ''
}

function formatCardNumber(val) {
  const digits = val.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 2) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

function formatPrice(n) { return '₹' + Number(n || 0).toLocaleString('en-IN') }

export default function PaymentPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { bookingId, totalAmount, setBookingRef, goToStep, selectedFlight } = useBookingStore()

  const [method, setMethod] = useState('CREDIT_CARD')
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '', zip: '' })
  const [paypal, setPaypal] = useState({ email: '', password: '' })
  const [upi, setUpi] = useState({ id: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [serverError, setServerError] = useState('')

  // Handle callback from dummy bank
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const status = params.get('status')
    const token = params.get('token')
    if (status && token) {
      handleCallback(token, status)
    }
  }, [location.search])

  const handleCallback = async (token, status) => {
    setProcessing(true)
    try {
      const res = await paymentAPI.handleCallback(token, status)
      const bookingRef = res.data.data?.booking_ref || res.data.data?.bookingRef
      if (bookingRef) {
        setBookingRef(bookingRef)
        goToStep(7)
        navigate(`/confirmation/${bookingRef}`)
      } else {
        setServerError('Payment verification failed. Contact support.')
      }
    } catch (err) {
      if (status === 'FAILURE') {
        setServerError('Payment was unsuccessful. Please try a different payment method or card.')
      } else {
        setServerError(err.response?.data?.error?.message || 'Payment verification failed. Contact support.')
      }
    } finally {
      setProcessing(false)
    }
  }

  const validateCard = () => {
    const errs = {}
    const raw = card.number.replace(/\D/g, '')
    if (!raw) errs.number = 'Enter a valid 16-digit card number'
    else if (raw.length !== 16) errs.number = 'Enter a valid 16-digit card number'
    // Demo-friendly validation: enforce numeric length, but don't block on network-specific checks.
    else if (!/^\d{16}$/.test(raw)) errs.number = 'Enter a valid 16-digit card number'

    if (!card.expiry) errs.expiry = 'Card expiry date is invalid or has passed'
    else {
      const [mm, yy] = card.expiry.split('/')
      const expDate = new Date(2000 + parseInt(yy), parseInt(mm) - 1, 1)
      const now = new Date()
      if (expDate < new Date(now.getFullYear(), now.getMonth(), 1)) errs.expiry = 'Card expiry date is invalid or has passed'
    }

    if (!card.cvv) errs.cvv = 'Enter a valid CVV'
    else if (!/^\d{3,4}$/.test(card.cvv)) errs.cvv = 'Enter a valid CVV'

    if (!card.name.trim()) errs.name = 'Enter the name as it appears on your card'
    else if (!/^[A-Za-z\s]{3,60}$/.test(card.name.trim())) errs.name = 'Enter the name as it appears on your card'

    return errs
  }

  const validatePaypal = () => {
    const errs = {}
    if (!paypal.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypal.email)) errs.email = 'Enter a valid PayPal email'
    if (!paypal.password || paypal.password.length < 8) errs.password = 'Enter your PayPal password'
    return errs
  }

  const validateUpi = () => {
    const errs = {}
    if (!upi.id || !/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/.test(upi.id)) errs.id = 'Enter a valid UPI ID (e.g. name@bank)'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    let errs = {}
    if (method === 'CREDIT_CARD' || method === 'DEBIT_CARD') errs = validateCard()
    else if (method === 'PAYPAL') errs = validatePaypal()
    else if (method === 'UPI') errs = validateUpi()
    setErrors(errs)
    if (Object.keys(errs).length) return

    setLoading(true)
    setServerError('')
    try {
      const payload = {
        payment_method: method,
        amount: totalAmount,
        ...(method !== 'PAYPAL' && method !== 'UPI' ? { card_last4: card.number.replace(/\s/g, '').slice(-4) } : {}),
      }
      const res = await paymentAPI.initiate(bookingId, payload)
      const { redirect_url } = res.data.data || {}
      if (redirect_url) {
        window.location.href = redirect_url
      } else {
        // Fallback: simulate success
        const { booking_ref } = res.data.data || {}
        if (booking_ref) {
          setBookingRef(booking_ref)
          goToStep(7)
          navigate(`/confirmation/${booking_ref}`)
        }
      }
    } catch (err) {
      setServerError(err.response?.data?.error?.message || 'Payment initiation failed. Please check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  const cardType = detectCard(card.number)

  const CARD_TYPE_ICONS = { Visa: '💳', Mastercard: '💳', Amex: '💳', RuPay: '💳' }

  if (processing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="card-lg text-center max-w-sm">
          <div className="text-5xl mb-4">🏦</div>
          <h2 className="text-xl font-bold mb-3">Processing Payment</h2>
          <div className="progress-bar h-3 mb-3"><div className="progress-fill animate-pulse w-3/4" /></div>
          <p className="text-gray-500 text-sm">Please wait, verifying your payment...</p>
          <p className="text-yellow-600 text-xs mt-2">Do not refresh this page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <StepBar current={6} />

        <div className="card-lg">
          {/* Secure Badge */}
          <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-lg py-2.5 px-4 mb-6 text-sm font-semibold text-green-700">
            🔒 Secure Payment — SSL Encrypted
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-6">💳 Payment</h1>

          {/* Method Selector */}
          <div className="flex gap-2 mb-6" data-testid="payment-method-tabs">
            {[['CREDIT_CARD', '💳 Card'], ['PAYPAL', '🅿️ PayPal'], ['UPI', '📱 UPI']].map(([val, lbl]) => (
              <button key={val} type="button"
                data-testid={`payment-method-${val.toLowerCase()}`}
                onClick={() => { setMethod(val); setErrors({}) }}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm border-b-2 transition-all
                  ${method === val ? 'border-primary-500 text-primary-700 bg-primary-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                {lbl}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} data-testid="payment-form" className="space-y-4">
            {/* Card Form */}
            {(method === 'CREDIT_CARD' || method === 'DEBIT_CARD') && (
              <>
                {/* Card Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                    {cardType && <span className="ml-2 text-xs font-semibold text-primary-600">{CARD_TYPE_ICONS[cardType]} {cardType}</span>}
                  </label>
                  <input
                    data-testid="payment-card-number"
                    type="text" inputMode="numeric"
                    value={card.number}
                    onChange={e => { setCard(p => ({ ...p, number: formatCardNumber(e.target.value) })); setErrors(er => ({ ...er, number: '' })) }}
                    placeholder="4111 1111 1111 1111" maxLength={19}
                    className={`w-full font-mono ${errors.number ? 'input-error' : ''}`}
                  />
                  {errors.number && <p className="error-text mt-1">✕ {errors.number}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Expiry */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input
                      data-testid="payment-card-expiry"
                      type="text" inputMode="numeric"
                      value={card.expiry}
                      onChange={e => { setCard(p => ({ ...p, expiry: formatExpiry(e.target.value) })); setErrors(er => ({ ...er, expiry: '' })) }}
                      placeholder="MM/YY" maxLength={5}
                      className={`w-full ${errors.expiry ? 'input-error' : ''}`}
                    />
                    {errors.expiry && <p className="error-text mt-1">✕ {errors.expiry}</p>}
                  </div>
                  {/* CVV */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                    <input
                      data-testid="payment-card-cvv"
                      type="password" inputMode="numeric"
                      value={card.cvv}
                      onChange={e => { setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })); setErrors(er => ({ ...er, cvv: '' })) }}
                      placeholder="•••" maxLength={4}
                      className={`w-full ${errors.cvv ? 'input-error' : ''}`}
                    />
                    {errors.cvv && <p className="error-text mt-1">✕ {errors.cvv}</p>}
                  </div>
                </div>

                {/* Name on Card */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                  <input
                    data-testid="payment-card-name"
                    type="text"
                    value={card.name}
                    onChange={e => { setCard(p => ({ ...p, name: e.target.value })); setErrors(er => ({ ...er, name: '' })) }}
                    placeholder="As printed on card"
                    className={`w-full ${errors.name ? 'input-error' : ''}`}
                  />
                  {errors.name && <p className="error-text mt-1">✕ {errors.name}</p>}
                </div>
              </>
            )}

            {/* PayPal Form */}
            {method === 'PAYPAL' && (
              <>
                <div className="bg-blue-50 rounded-lg p-4 mb-2 text-sm text-blue-700">
                  This is a mock PayPal flow for demo purposes only.
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PayPal Email</label>
                  <input
                    data-testid="payment-paypal-email"
                    type="email" value={paypal.email}
                    onChange={e => { setPaypal(p => ({ ...p, email: e.target.value })); setErrors(er => ({ ...er, email: '' })) }}
                    placeholder="your@paypal.com"
                    className={`w-full ${errors.email ? 'input-error' : ''}`}
                  />
                  {errors.email && <p className="error-text mt-1">✕ {errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PayPal Password</label>
                  <input
                    data-testid="payment-paypal-password"
                    type="password" value={paypal.password}
                    onChange={e => { setPaypal(p => ({ ...p, password: e.target.value })); setErrors(er => ({ ...er, password: '' })) }}
                    placeholder="Your PayPal password"
                    className={`w-full ${errors.password ? 'input-error' : ''}`}
                  />
                  {errors.password && <p className="error-text mt-1">✕ {errors.password}</p>}
                </div>
              </>
            )}

            {/* UPI Form */}
            {method === 'UPI' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                <input
                  data-testid="payment-upi-id"
                  type="text" value={upi.id}
                  onChange={e => { setUpi({ id: e.target.value }); setErrors(er => ({ ...er, id: '' })) }}
                  placeholder="name@bank (e.g. user@okicici)"
                  className={`w-full ${errors.id ? 'input-error' : ''}`}
                />
                {errors.id && <p className="error-text mt-1">✕ {errors.id}</p>}
                <p className="text-xs text-gray-400 mt-1">Examples: user@okicici, testpay@ybl, demo@paytm</p>
              </div>
            )}

            {serverError && (
              <div data-testid="payment-error" className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                ✕ {serverError}
              </div>
            )}

            {/* Total */}
            <div className="bg-gray-50 rounded-xl px-5 py-4 flex justify-between items-center">
              <span className="text-gray-600 font-medium">Total to Pay</span>
              <span className="text-2xl font-bold text-primary-700">{formatPrice(totalAmount)}</span>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => navigate('/summary')} className="btn-secondary flex-1">← Back</button>
              <button
                data-testid="payment-submit-button"
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 py-3 text-base font-bold"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin text-lg">⏳</span> Paying...
                  </span>
                ) : `Pay ${formatPrice(totalAmount)}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
