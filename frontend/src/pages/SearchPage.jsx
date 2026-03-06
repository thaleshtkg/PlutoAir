import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { flightAPI } from '../api/services'
import { useBookingStore } from '../store/bookingStore'
import StepBar from '../components/StepBar'

function CityAutocomplete({ label, value, onChange, onSelect, placeholder, testId, error }) {
  const [query, setQuery] = useState(value?.name ? `${value.name} (${value.iata_code})` : '')
  const [options, setOptions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef()
  const wrapperRef = useRef()
  const [allCities, setAllCities] = useState([])

  useEffect(() => {
    flightAPI.getCities().then(r => setAllCities(r.data.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (value === null) setQuery('')
    else if (value?.name) setQuery(`${value.name} (${value.iata_code})`)
  }, [value])

  const search = (q) => {
    const term = (q || '').trim().toLowerCase()
    setLoading(true)
    const filtered = term
      ? allCities.filter(c =>
          c.name.toLowerCase().includes(term) ||
          c.iata_code.toLowerCase().includes(term)
        )
      : allCities
    setOptions(filtered)
    setOpen(true)
    setLoading(false)
  }

  const handleInput = (e) => {
    const q = e.target.value
    setQuery(q)
    onChange(null)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), 300)
  }

  const handleSelect = (city) => {
    setQuery(`${city.name} (${city.iata_code})`)
    setOptions([])
    setOpen(false)
    onSelect(city)
  }

  useEffect(() => {
    const handler = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        data-testid={testId}
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={() => search(query)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full ${error ? 'input-error' : ''}`}
      />
      {loading && <div className="absolute right-3 top-9 text-gray-400 text-xs">...</div>}
      {open && options.length > 0 && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {options.map(city => (
            <button key={city.id} type="button" onClick={() => handleSelect(city)}
              className="w-full text-left px-4 py-3 hover:bg-primary-50 text-sm border-b border-gray-50 last:border-0 transition-colors">
              <span className="font-semibold">{city.name}</span>
              <span className="text-gray-500 ml-1">({city.iata_code})</span>
              {city.country && <span className="text-gray-400 ml-1">— {city.country}</span>}
            </button>
          ))}
        </div>
      )}
      {open && !loading && options.length === 0 && query && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl p-4 text-sm text-gray-500">
          No cities found. Try a different name.
        </div>
      )}
      {error && <p className="error-text mt-1">✕ {error}</p>}
    </div>
  )
}

function PassengerCounter({ adults, children, newborns, onChange }) {
  const [open, setOpen] = useState(false)
  const total = adults + children + newborns

  const update = (type, delta) => {
    const next = { adults, children, newborns, [type]: Math.max(0, (type === 'adults' ? adults : type === 'children' ? children : newborns) + delta) }
    if (type === 'adults') next.adults = Math.max(1, adults + delta)
    onChange(next)
  }

  const Row = ({ label, sub, type, count, min, max }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <div className="font-medium text-gray-800">{label}</div>
        <div className="text-xs text-gray-500">{sub}</div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button"
          data-testid={`passenger-${type}-decrease`}
          onClick={() => update(type, -1)}
          disabled={count <= min || (type === 'adults' && count <= 1)}
          aria-label={`Decrease ${label} count`}
          className="w-8 h-8 rounded-full border-2 border-primary-300 text-primary-600 font-bold hover:bg-primary-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg leading-none">−</button>
        <span data-testid={`passenger-${type}-count`} className="w-6 text-center font-semibold">{count}</span>
        <button type="button"
          data-testid={`passenger-${type}-increase`}
          onClick={() => update(type, 1)}
          disabled={count >= max || total >= 9}
          aria-label={`Increase ${label} count`}
          className="w-8 h-8 rounded-full border-2 border-primary-300 text-primary-600 font-bold hover:bg-primary-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg leading-none">+</button>
      </div>
    </div>
  )

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
      <button type="button" data-testid="passenger-toggle"
        onClick={() => setOpen(v => !v)}
        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-left hover:border-primary-400 transition-colors flex justify-between items-center">
        <span className="text-gray-800">{adults} Adult{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} Child${children > 1 ? 'ren' : ''}` : ''}{newborns > 0 ? `, ${newborns} Newborn${newborns > 1 ? 's' : ''}` : ''}</span>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl p-4">
          <Row label="Adults" sub="12+ years" type="adults" count={adults} min={1} max={9} />
          <Row label="Children" sub="2–11 years" type="children" count={children} min={0} max={8} />
          <Row label="Newborns" sub="0–23 months" type="newborns" count={newborns} min={0} max={4} />
          <div className="text-xs text-gray-500 mt-3 text-right">Total: <b>{total}</b> passenger{total > 1 ? 's' : ''} (max 9)</div>
          <button type="button" onClick={() => setOpen(false)}
            className="mt-3 w-full btn-primary text-sm py-2">Done</button>
        </div>
      )}
    </div>
  )
}

const today = new Date().toISOString().split('T')[0]

export default function SearchPage() {
  const navigate = useNavigate()
  const { setSearchParams, goToStep, searchParams } = useBookingStore()

  const [tripType, setTripType] = useState(searchParams.tripType || 'ONE_WAY')
  const [origin, setOrigin] = useState(searchParams.origin || null)
  const [destination, setDestination] = useState(searchParams.destination || null)
  const [travelDate, setTravelDate] = useState(searchParams.travelDate || '')
  const [returnDate, setReturnDate] = useState(searchParams.returnDate || '')
  const [adults, setAdults] = useState(searchParams.adults || 1)
  const [children, setChildren] = useState(searchParams.children || 0)
  const [newborns, setNewborns] = useState(searchParams.newborns || 0)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handlePassengers = ({ adults: a, children: c, newborns: n }) => {
    setAdults(a); setChildren(c); setNewborns(n)
    setErrors(e => ({ ...e, passengers: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!origin) errs.origin = 'Please select your departure city.'
    if (!destination) errs.destination = 'Please select your arrival city.'
    if (origin && destination && origin.id === destination.id) errs.destination = 'Departure and arrival cities cannot be the same.'
    if (!travelDate) errs.travelDate = 'Please select your travel date.'
    if (travelDate && travelDate < today) errs.travelDate = 'Travel date must be today or in the future.'
    if (tripType === 'RETURN') {
      if (!returnDate) errs.returnDate = 'Please select your return date.'
      if (returnDate && travelDate && returnDate < travelDate) errs.returnDate = 'Return date must be the same as or after your travel date.'
    }
    if (adults < 1) errs.passengers = 'Please add at least 1 adult passenger to search flights.'
    if (newborns > 0 && adults < 1) errs.passengers = 'A newborn must be accompanied by at least 1 adult.'
    if (adults + children + newborns > 9) errs.passengers = 'Maximum 9 passengers allowed per booking.'
    return errs
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      const fieldOrder = ['origin', 'destination', 'travelDate', 'returnDate', 'passengers']
      const firstErr = fieldOrder.find(f => errs[f])
      document.querySelector(`[data-testid="search-${firstErr}-input"]`)?.focus()
      return
    }
    setLoading(true)
    setErrors({})
    const params = { origin, destination, travelDate, returnDate: tripType === 'RETURN' ? returnDate : null, tripType, adults, children, newborns }
    setSearchParams(params)
    goToStep(2)
    navigate('/results')
  }

  const swapCities = () => {
    setOrigin(destination)
    setDestination(origin)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-3xl">
        <StepBar current={1} />

        <div className="card-lg">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ✈️ Where would you like to go?
            </h1>
            <p className="text-gray-500">Search flights across 20 cities worldwide</p>
          </div>

          {/* Trip Type Toggle */}
          <div className="flex gap-2 mb-6 justify-center" data-testid="search-trip-type-toggle">
            {[['ONE_WAY', '✈ One Way'], ['RETURN', '⇄ Return']].map(([val, lbl]) => (
              <button key={val} type="button" data-testid={`search-trip-${val.toLowerCase()}`}
                onClick={() => { setTripType(val); if (val === 'ONE_WAY') setReturnDate('') }}
                className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all border-2
                  ${tripType === val ? 'bg-primary-600 text-white border-primary-600 shadow' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}>
                {lbl}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} data-testid="search-form">
            {/* Origin / Destination */}
            <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
              <div className="flex-1">
                <CityAutocomplete
                  label="From"
                  value={origin}
                  onChange={setOrigin}
                  onSelect={(c) => { setOrigin(c); setErrors(e => ({ ...e, origin: '', destination: '' })) }}
                  placeholder="Departure city"
                  testId="search-origin-input"
                  error={errors.origin}
                />
              </div>

              <button type="button" data-testid="search-swap-button"
                onClick={swapCities}
                title="Swap cities"
                className="mb-1 md:mb-6 w-10 h-10 rounded-full border-2 border-primary-300 text-primary-600 hover:bg-primary-50 flex items-center justify-center flex-shrink-0 transition-all hover:rotate-180 duration-300 text-lg font-bold self-start mt-6">
                ⇄
              </button>

              <div className="flex-1">
                <CityAutocomplete
                  label="To"
                  value={destination}
                  onChange={setDestination}
                  onSelect={(c) => { setDestination(c); setErrors(e => ({ ...e, destination: '', origin: '' })) }}
                  placeholder="Arrival city"
                  testId="search-destination-input"
                  error={errors.destination}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Travel Date</label>
                <input
                  data-testid="search-traveldate-input"
                  type="date"
                  min={today}
                  value={travelDate}
                  onChange={e => { setTravelDate(e.target.value); setErrors(er => ({ ...er, travelDate: '' })) }}
                  className={`w-full ${errors.travelDate ? 'input-error' : ''}`}
                />
                {errors.travelDate && <p className="error-text mt-1">✕ {errors.travelDate}</p>}
              </div>

              {tripType === 'RETURN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                  <input
                    data-testid="search-returndate-input"
                    type="date"
                    min={travelDate || today}
                    value={returnDate}
                    disabled={!travelDate}
                    onChange={e => { setReturnDate(e.target.value); setErrors(er => ({ ...er, returnDate: '' })) }}
                    className={`w-full ${errors.returnDate ? 'input-error' : ''} ${!travelDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  {errors.returnDate && <p className="error-text mt-1">✕ {errors.returnDate}</p>}
                </div>
              )}
            </div>

            {/* Passengers */}
            <div className="mb-6">
              <PassengerCounter
                adults={adults} children={children} newborns={newborns}
                onChange={handlePassengers}
              />
              {errors.passengers && <p className="error-text mt-1">✕ {errors.passengers}</p>}
            </div>

            {/* Search Button */}
            <button
              data-testid="search-button-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg py-4 rounded-xl font-bold tracking-wide"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Searching...
                </span>
              ) : '🔍 Search Flights'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
