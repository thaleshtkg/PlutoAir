import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingAPI } from '../api/services'
import { useBookingStore } from '../store/bookingStore'
import StepBar from '../components/StepBar'

const BAGGAGE_OPTIONS = [
  { id: 'bag5', label: '+5 kg', price: 500, max: 4, icon: '🧳' },
  { id: 'bag10', label: '+10 kg', price: 900, max: 2, icon: '🧳' },
  { id: 'bag15', label: '+15 kg', price: 1200, max: 2, icon: '🧳' },
  { id: 'bag20', label: '+20 kg', price: 1500, max: 1, icon: '🧳' },
]

const MEAL_OPTIONS = [
  { id: 'meal_veg', label: 'Vegetarian Meal', price: 280, icon: '🥗' },
  { id: 'meal_nonveg', label: 'Non-Vegetarian', price: 320, icon: '🍗' },
  { id: 'meal_jain', label: 'Jain Meal', price: 280, icon: '🌿' },
  { id: 'meal_kids', label: 'Kids Meal', price: 250, icon: '🍭' },
  { id: 'meal_diabetic', label: 'Diabetic Meal', price: 280, icon: '🥦' },
  { id: 'meal_none', label: 'No Meal', price: 0, icon: '⊘' },
]

const INSURANCE_OPTIONS = [
  { id: 'ins_basic', label: 'Basic', coverage: '₹5 lakh', price: 150, icon: '🛡️' },
  { id: 'ins_standard', label: 'Standard', coverage: '₹10 lakh', price: 300, icon: '🛡️' },
  { id: 'ins_premium', label: 'Premium', coverage: '₹25 lakh', price: 500, icon: '🛡️' },
]

const SEAT_OPTIONS = [
  { id: 'seat_standard', label: 'Standard', price: 0, icon: '💺' },
  { id: 'seat_window', label: 'Window Seat', price: 250, icon: '🪟' },
  { id: 'seat_aisle', label: 'Aisle Seat', price: 200, icon: '⇆' },
  { id: 'seat_legroom', label: 'Extra Legroom', price: 800, icon: '🦵' },
]

function Qty({ value, onDecrease, onIncrease, min = 0, max }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onDecrease} disabled={value <= min}
        className="w-7 h-7 rounded-full border-2 border-primary-300 text-primary-600 font-bold hover:bg-primary-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center">−</button>
      <span className="w-5 text-center text-sm font-semibold">{value}</span>
      <button type="button" onClick={onIncrease} disabled={value >= max}
        className="w-7 h-7 rounded-full border-2 border-primary-300 text-primary-600 font-bold hover:bg-primary-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center">+</button>
    </div>
  )
}

function formatPrice(n) { return '₹' + Number(n).toLocaleString('en-IN') }

export default function AddOnsPage() {
  const navigate = useNavigate()
  const { selectedFlight, searchParams, setAddOns, setTotalAmount, goToStep, bookingId, setBookingId } = useBookingStore()

  const { adults = 1, children = 0, newborns = 0 } = searchParams
  const totalPax = adults + children + newborns

  const [baggage, setBaggage] = useState({ bag5: 0, bag10: 0, bag15: 0, bag20: 0 })
  const [meal, setMeal] = useState('meal_none')
  const [insurance, setInsurance] = useState(null)
  const [seat, setSeat] = useState('seat_standard')
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  if (!selectedFlight) { navigate('/search'); return null }

  const baseFareAdult = Number(selectedFlight.base_price_adult || 0) * adults
  const baseFareChild = Number(selectedFlight.base_price_child || 0) * children
  const baseFareNewborn = Number(selectedFlight.base_price_newborn || 0) * newborns

  const baggageTotal = BAGGAGE_OPTIONS.reduce((sum, opt) => sum + (baggage[opt.id] || 0) * opt.price * totalPax, 0)
  const mealOpt = MEAL_OPTIONS.find(m => m.id === meal)
  const mealTotal = (mealOpt?.price || 0) * totalPax
  const insOpt = INSURANCE_OPTIONS.find(i => i.id === insurance)
  const insuranceTotal = (insOpt?.price || 0) * totalPax
  const seatOpt = SEAT_OPTIONS.find(s => s.id === seat)
  const seatTotal = (seatOpt?.price || 0) * totalPax

  const subtotal = baseFareAdult + baseFareChild + baseFareNewborn + baggageTotal + mealTotal + insuranceTotal + seatTotal
  const gst = Math.round(subtotal * 0.18)
  const grandTotal = subtotal + gst

  const handleContinue = async () => {
    setLoading(true)
    setServerError('')
    const addons = []
    BAGGAGE_OPTIONS.forEach(opt => {
      if (baggage[opt.id] > 0) addons.push({ addon_type: 'BAGGAGE', description: opt.label, quantity: baggage[opt.id] * totalPax, unit_price: opt.price, total_price: baggage[opt.id] * opt.price * totalPax })
    })
    if (meal && meal !== 'meal_none') {
      addons.push({ addon_type: 'MEAL', description: mealOpt?.label, quantity: totalPax, unit_price: mealOpt?.price, total_price: mealTotal })
    }
    if (insurance) {
      addons.push({ addon_type: 'INSURANCE', description: `${insOpt?.label} (${insOpt?.coverage})`, quantity: totalPax, unit_price: insOpt?.price, total_price: insuranceTotal })
    }
    if (seat && seat !== 'seat_standard') {
      addons.push({ addon_type: 'SEAT', description: seatOpt?.label, quantity: totalPax, unit_price: seatOpt?.price, total_price: seatTotal })
    }
    try {
      if (bookingId) {
        await bookingAPI.addAddOns(bookingId, addons)
      }
      setAddOns(addons)
      setTotalAmount(grandTotal)
      goToStep(5)
      navigate('/summary')
    } catch (err) {
      setServerError('Unable to save add-ons. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <StepBar current={4} />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Add-ons */}
          <div className="flex-1">
            <div className="card-lg mb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">✨ Enhance Your Journey</h1>
              <p className="text-gray-500 text-sm mb-6">Customize your travel experience with optional add-ons</p>

              {/* Extra Baggage */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">🧳 Extra Baggage <span className="text-xs text-gray-400 font-normal">(per person)</span></h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BAGGAGE_OPTIONS.map(opt => (
                    <div key={opt.id} className={`border-2 rounded-xl p-4 transition-all ${baggage[opt.id] > 0 ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-gray-800">{opt.label}</div>
                          <div className="text-primary-600 font-bold">{formatPrice(opt.price)}<span className="text-gray-400 font-normal text-xs">/person</span></div>
                        </div>
                        {baggage[opt.id] > 0 && <span className="text-green-500 text-lg">✓</span>}
                      </div>
                      <Qty value={baggage[opt.id]} min={0} max={opt.max}
                        onDecrease={() => setBaggage(b => ({ ...b, [opt.id]: Math.max(0, b[opt.id] - 1) }))}
                        onIncrease={() => setBaggage(b => ({ ...b, [opt.id]: Math.min(opt.max, b[opt.id] + 1) }))}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Meal */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">🍽️ Meal Selection <span className="text-xs text-gray-400 font-normal">(per passenger, per leg)</span></h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MEAL_OPTIONS.map(opt => (
                    <button key={opt.id} type="button" onClick={() => setMeal(opt.id)}
                      className={`border-2 rounded-xl p-3 flex flex-col items-center gap-1 transition-all
                        ${meal === opt.id ? 'border-primary-500 bg-primary-50 shadow' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="text-2xl">{opt.icon}</span>
                      <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{opt.label}</span>
                      <span className={`text-sm font-bold ${opt.price > 0 ? 'text-primary-600' : 'text-gray-400'}`}>{opt.price > 0 ? formatPrice(opt.price) : 'Free'}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Insurance */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">🛡️ Travel Insurance</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {INSURANCE_OPTIONS.map(opt => (
                    <button key={opt.id} type="button" onClick={() => setInsurance(insurance === opt.id ? null : opt.id)}
                      className={`border-2 rounded-xl p-4 text-left transition-all
                        ${insurance === opt.id ? 'border-green-500 bg-green-50 shadow' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-800">{opt.label}</span>
                        {insurance === opt.id && <span className="text-green-500">✓</span>}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">Coverage: {opt.coverage}</div>
                      <div className="text-primary-600 font-bold">{formatPrice(opt.price)}<span className="text-gray-400 font-normal text-xs">/person</span></div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Seat */}
              <section className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">💺 Seat Preference</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SEAT_OPTIONS.map(opt => (
                    <button key={opt.id} type="button" onClick={() => setSeat(opt.id)}
                      className={`border-2 rounded-xl p-3 flex flex-col items-center gap-1 transition-all
                        ${seat === opt.id ? 'border-primary-500 bg-primary-50 shadow' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="text-2xl">{opt.icon}</span>
                      <span className="text-xs font-semibold text-center text-gray-700">{opt.label}</span>
                      <span className={`text-sm font-bold ${opt.price > 0 ? 'text-primary-600' : 'text-gray-400'}`}>{opt.price > 0 ? formatPrice(opt.price) : 'Free'}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">✕ {serverError}</div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => navigate('/passengers')} className="btn-secondary flex-1">← Back</button>
              <button data-testid="addons-continue-button" type="button" onClick={handleContinue} disabled={loading} className="btn-primary flex-1">
                {loading ? '⏳ Saving...' : 'Continue → Summary'}
              </button>
            </div>
          </div>

          {/* Price Panel */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="card lg:sticky lg:top-24">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">💰 Price Summary</h3>
              <div className="space-y-2 text-sm">
                {adults > 0 && <div className="flex justify-between"><span className="text-gray-600">Adults × {adults}</span><span>{formatPrice(baseFareAdult)}</span></div>}
                {children > 0 && <div className="flex justify-between"><span className="text-gray-600">Children × {children}</span><span>{formatPrice(baseFareChild)}</span></div>}
                {newborns > 0 && <div className="flex justify-between"><span className="text-gray-600">Newborns × {newborns}</span><span>{formatPrice(baseFareNewborn)}</span></div>}
                {baggageTotal > 0 && <div className="flex justify-between"><span className="text-gray-600">Extra Baggage</span><span>{formatPrice(baggageTotal)}</span></div>}
                {mealTotal > 0 && <div className="flex justify-between"><span className="text-gray-600">Meals</span><span>{formatPrice(mealTotal)}</span></div>}
                {insuranceTotal > 0 && <div className="flex justify-between"><span className="text-gray-600">Insurance</span><span>{formatPrice(insuranceTotal)}</span></div>}
                {seatTotal > 0 && <div className="flex justify-between"><span className="text-gray-600">Seat</span><span>{formatPrice(seatTotal)}</span></div>}
                <div className="border-t pt-2 flex justify-between"><span className="text-gray-600">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Taxes & GST (18%)</span><span>{formatPrice(gst)}</span></div>
                <div className="border-t-2 border-gray-800 pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-base">TOTAL</span>
                  <span className="font-bold text-primary-700 text-xl">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
