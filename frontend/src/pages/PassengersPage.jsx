import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingAPI } from '../api/services'
import { useBookingStore } from '../store/bookingStore'
import StepBar from '../components/StepBar'
import { calcAge, validateAge, buildPassengerList } from '../utils/passengerUtils'

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'France', 'Germany', 'Japan', 'China', 'Singapore', 'UAE', 'Russia', 'Other']

function PassengerForm({ index, passenger, category, onChange, travelDate, errors }) {
  const catLabel = category === 'ADULT' ? 'Adult' : category === 'CHILD' ? 'Child' : 'Newborn'
  const catColor = category === 'ADULT' ? 'bg-blue-100 text-blue-800' : category === 'CHILD' ? 'bg-green-100 text-green-800' : 'bg-pink-100 text-pink-800'

  const field = (name, value) => onChange(index, name, value)
  const err = (name) => errors?.[name]

  return (
    <div className="card mb-4 border border-gray-100">
      <div className="flex items-center gap-3 mb-5">
        <div className={`text-xs font-bold px-3 py-1 rounded-full ${catColor}`}>{catLabel}</div>
        <h3 className="font-semibold text-gray-800">Passenger {index + 1}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
          <input
            data-testid={`passenger-${index}-firstname`}
            type="text" value={passenger.first_name || ''}
            onChange={e => field('first_name', e.target.value)}
            placeholder="First name"
            className={`w-full ${err('first_name') ? 'input-error' : ''}`}
          />
          {err('first_name') && <p className="error-text mt-1">✕ {err('first_name')}</p>}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
          <input
            data-testid={`passenger-${index}-lastname`}
            type="text" value={passenger.last_name || ''}
            onChange={e => field('last_name', e.target.value)}
            placeholder="Last name"
            className={`w-full ${err('last_name') ? 'input-error' : ''}`}
          />
          {err('last_name') && <p className="error-text mt-1">✕ {err('last_name')}</p>}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
          <input
            data-testid={`passenger-${index}-dob`}
            type="date" value={passenger.dob || ''}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => field('dob', e.target.value)}
            className={`w-full ${err('dob') ? 'input-error' : ''}`}
          />
          {err('dob') && <p className="error-text mt-1">✕ {err('dob')}</p>}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
          <select
            data-testid={`passenger-${index}-gender`}
            value={passenger.gender || ''}
            onChange={e => field('gender', e.target.value)}
            className={`w-full ${err('gender') ? 'input-error' : ''}`}
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {err('gender') && <p className="error-text mt-1">✕ {err('gender')}</p>}
        </div>

        {/* Nationality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nationality *</label>
          <select
            data-testid={`passenger-${index}-nationality`}
            value={passenger.nationality || ''}
            onChange={e => field('nationality', e.target.value)}
            className={`w-full ${err('nationality') ? 'input-error' : ''}`}
          >
            <option value="">Select country</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {err('nationality') && <p className="error-text mt-1">✕ {err('nationality')}</p>}
        </div>

        {/* Passport / ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Passport / ID <span className="text-gray-400">(optional for domestic)</span>
          </label>
          <input
            data-testid={`passenger-${index}-passport`}
            type="text" value={passenger.passport_id || ''}
            onChange={e => field('passport_id', e.target.value)}
            placeholder="Passport or ID number"
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}

export default function PassengersPage() {
  const navigate = useNavigate()
  const { searchParams, selectedFlight, bookingId, setBookingId, setPassengers, goToStep } = useBookingStore()
  const { adults = 1, children = 0, newborns = 0, travelDate } = searchParams

  const [passengers, setLocalPassengers] = useState(() => buildPassengerList(adults, children, newborns))
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  if (!selectedFlight) { navigate('/search'); return null }

  const handleChange = (index, field, value) => {
    setLocalPassengers(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
    setErrors(prev => {
      const updated = [...prev]
      if (updated[index]) delete updated[index][field]
      return updated
    })
  }

  const validateAll = () => {
    const allErrors = passengers.map((p) => {
      const errs = {}
      if (!p.first_name?.trim()) errs.first_name = 'First name is required'
      else if (!/^[A-Za-z\s]+$/.test(p.first_name.trim())) errs.first_name = 'Letters only'
      if (!p.last_name?.trim()) errs.last_name = 'Last name is required'
      else if (!/^[A-Za-z\s]+$/.test(p.last_name.trim())) errs.last_name = 'Letters only'
      if (!p.dob) errs.dob = 'Date of birth is required'
      else {
        const ageErr = validateAge(p.dob, p.category, travelDate)
        if (ageErr) errs.dob = ageErr
      }
      if (!p.gender) errs.gender = 'Gender is required'
      if (!p.nationality) errs.nationality = 'Nationality is required'
      return errs
    })
    return allErrors
  }

  const handleContinue = async () => {
    const allErrors = validateAll()
    setErrors(allErrors)
    if (allErrors.some(e => Object.keys(e).length > 0)) return
    setLoading(true)
    setServerError('')
    try {
      const bookingState = useBookingStore.getState()
      let currentBookingId = bookingId
      if (!currentBookingId) {
        const res = await bookingAPI.create({
          flight_id: selectedFlight.id,
          return_flight_id: bookingState.selectedReturnFlight?.id || null,
          travel_date: travelDate,
          return_date: searchParams.returnDate || null,
          trip_type: searchParams.tripType,
          adults, children, newborns,
        })
        currentBookingId = res.data.data?.booking_id || res.data.data?.id
        setBookingId(currentBookingId)
      }
      await bookingAPI.addPassengers(currentBookingId, passengers.map(p => ({
        full_name: `${p.first_name.trim()} ${p.last_name.trim()}`,
        age_category: p.category,
        dob: p.dob,
        gender: p.gender,
        nationality: p.nationality,
        passport_id: p.passport_id,
      })))
      setPassengers(passengers)
      goToStep(4)
      navigate('/addons')
    } catch (err) {
      setServerError(err.response?.data?.error?.message || 'Failed to save passenger details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <StepBar current={3} />

        <div className="card-lg mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">👥 Passenger Details</h1>
          <p className="text-gray-500 text-sm mb-6">Please fill in details for all {passengers.length} passenger{passengers.length > 1 ? 's' : ''}</p>

          {/* Flight Summary */}
          <div className="bg-blue-50 rounded-xl px-5 py-4 mb-6 flex flex-wrap gap-4 items-center text-sm">
            <span className="font-semibold text-blue-800">{selectedFlight.airline_name} {selectedFlight.flight_number}</span>
            <span className="text-gray-500">|</span>
            <span className="text-blue-700">{searchParams.origin?.iata_code} → {searchParams.destination?.iata_code}</span>
            <span className="text-gray-500">|</span>
            <span className="text-blue-700">{travelDate}</span>
          </div>

          {passengers.map((p, i) => (
            <PassengerForm
              key={i} index={i} passenger={p} category={p.category}
              onChange={handleChange} travelDate={travelDate}
              errors={errors[i] || {}}
            />
          ))}

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
              ✕ {serverError}
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={() => navigate('/results')} className="btn-secondary flex-1">
              ← Back
            </button>
            <button
              data-testid="passengers-continue-button"
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? '⏳ Saving...' : 'Continue → Add-Ons'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
