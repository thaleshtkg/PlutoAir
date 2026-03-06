import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { flightAPI } from '../api/services'
import { useBookingStore } from '../store/bookingStore'
import { useToast } from '../store/toastStore'
import StepBar from '../components/StepBar'

function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="skeleton w-12 h-12 rounded" />
        <div className="flex-1 space-y-2">
          <div className="skeleton-text w-1/3" />
          <div className="skeleton-text w-2/3" />
        </div>
        <div className="skeleton w-24 h-10 rounded" />
      </div>
    </div>
  )
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  return timeStr.slice(0, 5)
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60), m = mins % 60
  return `${h}h ${m > 0 ? m + 'm' : ''}`
}

function formatPrice(price) {
  return '₹' + Number(price).toLocaleString('en-IN')
}

const AIRLINE_COLORS = {
  'IndiGo': 'bg-indigo-100 text-indigo-800', 'Air India': 'bg-red-100 text-red-800',
  'Vistara': 'bg-purple-100 text-purple-800', 'SpiceJet': 'bg-orange-100 text-orange-800',
  'GoFirst': 'bg-yellow-100 text-yellow-800', 'Emirates': 'bg-blue-100 text-blue-800',
  'British Airways': 'bg-blue-100 text-blue-800', 'Lufthansa': 'bg-yellow-100 text-yellow-800',
  'Singapore Airlines': 'bg-blue-100 text-blue-800', 'Air France': 'bg-sky-100 text-sky-800',
}

function FlightCard({ flight, selected, onSelect, badge }) {
  return (
    <div data-testid={`flight-card-${flight.id}`}
      onClick={() => onSelect(flight)}
      className={`card-flight relative cursor-pointer border-2 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
        ${selected ? 'border-primary-500 bg-primary-50 shadow-md' : 'border-transparent bg-white hover:border-primary-200'}`}>
      {badge && (
        <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full
          ${badge === 'Best Price' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {badge}
        </span>
      )}
      <div className="flex flex-wrap items-center gap-4">
        {/* Airline */}
        <div className="flex flex-col items-center w-20 flex-shrink-0">
          <div className={`text-xs font-bold px-2 py-1 rounded ${AIRLINE_COLORS[flight.airline_name] || 'bg-gray-100 text-gray-700'}`}>
            {flight.airline_iata || flight.airline_name?.slice(0, 2)}
          </div>
          <div className="text-xs text-gray-500 mt-1 text-center leading-tight">{flight.airline_name}</div>
          <div className="text-xs text-gray-400">{flight.flight_number}</div>
        </div>

        {/* Times */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formatTime(flight.departure_time)}</div>
            <div className="text-sm font-medium text-gray-600">{flight.origin_iata || flight.origin_name}</div>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="text-xs text-gray-400">{formatDuration(flight.duration_mins)}</div>
            <div className="relative w-full flex items-center">
              <div className="flex-1 h-0.5 bg-gray-300" />
              <div className="mx-1 text-primary-500">✈</div>
              <div className="flex-1 h-0.5 bg-gray-300" />
            </div>
            <div className="text-xs text-gray-400">Direct</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formatTime(flight.arrival_time)}</div>
            <div className="text-sm font-medium text-gray-600">{flight.destination_iata || flight.destination_name}</div>
          </div>
        </div>

        {/* Price & Selector */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="text-xs text-gray-500">from</div>
          <div className="text-2xl font-bold text-primary-700">{formatPrice(flight.base_price_adult)}</div>
          <div className="text-xs text-gray-400">per adult</div>
          <button type="button"
            data-testid={`flight-select-${flight.id}`}
            onClick={e => { e.stopPropagation(); onSelect(flight) }}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${selected
              ? 'bg-green-500 text-white'
              : 'bg-primary-600 text-white hover:bg-primary-700'}`}>
            {selected ? 'Selected ✓' : 'Select'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { searchParams, setSelectedFlight, setSelectedReturnFlight, goToStep } = useBookingStore()
  const [flights, setFlights] = useState([])
  const [returnFlights, setReturnFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [selectedReturn, setSelectedReturn] = useState(null)
  const [sortBy, setSortBy] = useState('price')
  const [filterAirlines, setFilterAirlines] = useState([])

  const isReturn = searchParams.tripType === 'RETURN'

  useEffect(() => {
    if (!searchParams.origin) { navigate('/search'); return }
    setLoading(true)
    setError('')
    const params = {
      origin_id: searchParams.origin?.id, destination_id: searchParams.destination?.id,
      travel_date: searchParams.travelDate, adults: searchParams.adults,
      children: searchParams.children, newborns: searchParams.newborns,
    }
    const searches = [flightAPI.search(params)]
    if (isReturn) {
      searches.push(flightAPI.search({ origin_id: searchParams.destination?.id, destination_id: searchParams.origin?.id, travel_date: searchParams.returnDate, adults: searchParams.adults, children: searchParams.children, newborns: searchParams.newborns }))
    }
    Promise.all(searches)
      .then(([out, ret]) => {
        setFlights(out.data.data || [])
        if (ret) setReturnFlights(ret.data.data || [])
      })
      .catch(() => setError('Unable to fetch flights. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const sortFlights = (list) => {
    const copy = [...list]
    if (sortBy === 'price') return copy.sort((a, b) => a.base_price_adult - b.base_price_adult)
    if (sortBy === 'duration') return copy.sort((a, b) => a.duration_mins - b.duration_mins)
    if (sortBy === 'departure') return copy.sort((a, b) => a.departure_time?.localeCompare(b.departure_time))
    return copy
  }

  const filterFlights = (list) => {
    if (filterAirlines.length === 0) return list
    return list.filter(f => filterAirlines.includes(f.airline_name))
  }

  const displayed = sortFlights(filterFlights(flights))
  const displayedReturn = sortFlights(filterFlights(returnFlights))
  const cheapest = displayed.length ? Math.min(...displayed.map(f => f.base_price_adult)) : 0
  const fastest = displayed.length ? Math.min(...displayed.map(f => f.duration_mins)) : 0
  const allAirlines = [...new Set(flights.map(f => f.airline_name).filter(Boolean))]

  const handleContinue = () => {
    if (!selected) { toast.warn('Please select a flight to continue.'); return }
    if (isReturn && !selectedReturn) { toast.warn('Please select your return flight to continue.'); return }
    setSelectedFlight(selected)
    if (isReturn) setSelectedReturnFlight(selectedReturn)
    goToStep(3)
    navigate('/passengers')
  }

  const handleModify = () => { navigate('/search') }

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <StepBar current={2} />

        {/* Search Summary */}
        <div className="card mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-gray-800">
              {searchParams.origin?.name} ({searchParams.origin?.iata_code}) → {searchParams.destination?.name} ({searchParams.destination?.iata_code})
            </span>
            <span className="text-gray-500 text-sm">|</span>
            <span className="text-gray-600 text-sm">{searchParams.travelDate}</span>
            {isReturn && <><span className="text-gray-500 text-sm">→</span><span className="text-gray-600 text-sm">{searchParams.returnDate}</span></>}
            <span className="text-gray-500 text-sm">|</span>
            <span className="text-gray-600 text-sm">{searchParams.adults}A{searchParams.children > 0 ? ` ${searchParams.children}C` : ''}{searchParams.newborns > 0 ? ` ${searchParams.newborns}NB` : ''}</span>
          </div>
          <button type="button" onClick={handleModify} className="btn-secondary text-sm py-1.5 px-4">✏️ Modify Search</button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="card">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-700 text-sm">Sort By</h3>
              </div>
              {[['price', '💰 Price'], ['duration', '⏱ Duration'], ['departure', '🕐 Departure']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setSortBy(v)}
                  className={`w-full text-left px-3 py-2 rounded text-sm mb-1 ${sortBy === v ? 'bg-primary-100 text-primary-700 font-semibold' : 'hover:bg-gray-50 text-gray-600'}`}>
                  {l}
                </button>
              ))}
              {allAirlines.length > 0 && (
                <>
                  <div className="border-t my-3" />
                  <h3 className="font-semibold text-gray-700 text-sm mb-2">Airlines</h3>
                  {allAirlines.map(a => (
                    <label key={a} className="flex items-center gap-2 text-sm text-gray-600 mb-2 cursor-pointer hover:text-gray-900">
                      <input type="checkbox" checked={filterAirlines.includes(a)}
                        onChange={() => setFilterAirlines(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a])}
                        className="w-4 h-4" />
                      {a}
                    </label>
                  ))}
                  {filterAirlines.length > 0 && (
                    <button type="button" onClick={() => setFilterAirlines([])} className="text-xs text-primary-600 hover:underline">Clear Filters</button>
                  )}
                </>
              )}
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {!isReturn ? (
              /* One Way */
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {loading ? 'Searching flights...' : `${displayed.length} flight${displayed.length !== 1 ? 's' : ''} found`}
                </h2>
                {loading && [1,2,3].map(i => <SkeletonCard key={i} />)}
                {error && (
                  <div className="card text-center py-10">
                    <div className="text-4xl mb-3">⚠️</div>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
                  </div>
                )}
                {!loading && !error && displayed.length === 0 && (
                  <div className="card text-center py-14">
                    <div className="text-5xl mb-4">🛫</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No flights found</h3>
                    <p className="text-gray-500 mb-2">No flights found for this route on {searchParams.travelDate}.</p>
                    <p className="text-gray-400 text-sm mb-5">Try adjusting your travel dates or nearby cities.</p>
                    <button className="btn-primary" onClick={handleModify}>Modify Search</button>
                  </div>
                )}
                <div className="space-y-3">
                  {displayed.map(f => (
                    <FlightCard key={f.id} flight={f}
                      selected={selected?.id === f.id}
                      onSelect={setSelected}
                      badge={f.base_price_adult === cheapest ? 'Best Price' : f.duration_mins === fastest && f.base_price_adult !== cheapest ? 'Fastest' : null}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Return — Split Screen */
              <div className="grid md:grid-cols-2 gap-4">
                {/* Outbound */}
                <div>
                  <div className="bg-primary-600 text-white rounded-t-xl px-4 py-3 font-semibold text-sm">
                    ✈ Outbound — {searchParams.origin?.iata_code} → {searchParams.destination?.iata_code} | {searchParams.travelDate}
                  </div>
                  <div className="space-y-2 mt-2">
                    {loading && [1,2].map(i => <SkeletonCard key={i} />)}
                    {!loading && displayed.map(f => (
                      <FlightCard key={f.id} flight={f} selected={selected?.id === f.id} onSelect={setSelected}
                        badge={f.base_price_adult === cheapest ? 'Best Price' : null} />
                    ))}
                    {!loading && displayed.length === 0 && (
                      <div className="card text-center py-8 text-gray-500">No outbound flights found</div>
                    )}
                  </div>
                </div>
                {/* Return */}
                <div>
                  <div className="bg-secondary-500 text-white rounded-t-xl px-4 py-3 font-semibold text-sm">
                    ✈ Return — {searchParams.destination?.iata_code} → {searchParams.origin?.iata_code} | {searchParams.returnDate}
                  </div>
                  <div className="space-y-2 mt-2">
                    {loading && [1,2].map(i => <SkeletonCard key={i} />)}
                    {!loading && displayedReturn.map(f => (
                      <FlightCard key={f.id} flight={f} selected={selectedReturn?.id === f.id} onSelect={setSelectedReturn}
                        badge={null} />
                    ))}
                    {!loading && displayedReturn.length === 0 && (
                      <div className="card text-center py-8 text-gray-500">No return flights found</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Continue Bar */}
        {!loading && (
          <div className="sticky bottom-0 bg-white border-t shadow-lg py-4 px-6 mt-6 flex flex-wrap items-center justify-between gap-4 rounded-t-2xl">
            <div className="text-sm text-gray-600 flex gap-6">
              {selected && <span className="text-green-700 font-semibold">✓ Outbound: {selected.flight_number} — {formatPrice(selected.base_price_adult)}</span>}
              {isReturn && selectedReturn && <span className="text-green-700 font-semibold">✓ Return: {selectedReturn.flight_number} — {formatPrice(selectedReturn.base_price_adult)}</span>}
              {!selected && <span className="text-gray-400">Select a flight to continue</span>}
            </div>
            <button
              data-testid="results-continue-button"
              type="button"
              onClick={handleContinue}
              disabled={!selected || (isReturn && !selectedReturn)}
              className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!selected || (isReturn && !selectedReturn) ? 'Please select both outbound and return flights to continue' : ''}>
              Continue → Passengers
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
