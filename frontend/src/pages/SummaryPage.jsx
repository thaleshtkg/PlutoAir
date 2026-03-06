import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBookingStore } from '../store/bookingStore'
import StepBar from '../components/StepBar'

function SectionCard({ icon, title, editTo, children }) {
  const navigate = useNavigate()
  return (
    <div className="card mb-4 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{icon} {title}</h2>
        {editTo && (
          <button type="button" onClick={() => navigate(editTo)}
            className="text-sm text-primary-600 hover:underline font-medium">✏️ Edit</button>
        )}
      </div>
      {children}
    </div>
  )
}

function FlightBlock({ flight, date, label }) {
  if (!flight) return null
  const dep = flight.departure_time?.slice(0, 5)
  const arr = flight.arrival_time?.slice(0, 5)
  const dur = flight.duration_mins ? `${Math.floor(flight.duration_mins / 60)}h ${flight.duration_mins % 60 > 0 ? flight.duration_mins % 60 + 'm' : ''}` : ''
  return (
    <div className="bg-blue-50 rounded-xl p-4 mb-2">
      {label && <div className="text-xs font-semibold text-primary-600 mb-2">{label}</div>}
      <div className="flex flex-wrap gap-4 items-center text-sm">
        <div><span className="font-bold text-gray-800">{flight.airline_name}</span> <span className="text-gray-500">{flight.flight_number}</span></div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 text-base">{dep}</span>
          <span className="text-gray-400">{flight.origin_iata || ''}</span>
          <span className="text-gray-300">→</span>
          <span className="font-bold text-gray-900 text-base">{arr}</span>
          <span className="text-gray-400">{flight.destination_iata || ''}</span>
        </div>
        {dur && <span className="text-gray-500">{dur}</span>}
        {date && <span className="text-gray-600 bg-white px-2 py-0.5 rounded">{date}</span>}
        <span className="text-gray-500">Economy</span>
      </div>
    </div>
  )
}

function formatPrice(n) { return '₹' + Number(n || 0).toLocaleString('en-IN') }

export default function SummaryPage() {
  const navigate = useNavigate()
  const { selectedFlight, selectedReturnFlight, searchParams, passengers, addOns, totalAmount, goToStep } = useBookingStore()
  const [confirmed, setConfirmed] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(false)

  if (!selectedFlight) { navigate('/search'); return null }

  const { adults = 1, children = 0, newborns = 0, travelDate, returnDate, tripType } = searchParams

  // Price breakdown
  const adultFare = Number(selectedFlight.base_price_adult || 0) * adults
  const childFare = Number(selectedFlight.base_price_child || 0) * children
  const newbornFare = Number(selectedFlight.base_price_newborn || 0) * newborns
  const addonsTotal = addOns.reduce((s, a) => s + Number(a.total_price || 0), 0)
  const subtotal = adultFare + childFare + newbornFare + addonsTotal
  const gst = Math.round(subtotal * 0.18)
  const grandTotal = totalAmount || subtotal + gst

  const handleConfirmAndPay = () => {
    if (!confirmed) { setTooltipVisible(true); return }
    goToStep(6)
    navigate('/payment')
  }

  const baggageAddons = addOns.filter(a => a.addon_type === 'BAGGAGE')
  const mealAddons = addOns.filter(a => a.addon_type === 'MEAL')
  const insuranceAddons = addOns.filter(a => a.addon_type === 'INSURANCE')
  const seatAddons = addOns.filter(a => a.addon_type === 'SEAT')

  return (
    <div className="min-h-screen py-6 px-4 pb-32">
      <div className="max-w-3xl mx-auto">
        <StepBar current={5} />

        <h1 className="text-2xl font-bold text-gray-900 mb-6">📋 Review Your Booking</h1>

        {/* Flight Details */}
        <SectionCard icon="✈️" title="Flight Details" editTo="/results">
          <FlightBlock flight={selectedFlight} date={travelDate} label={tripType === 'RETURN' ? 'Outbound' : null} />
          {tripType === 'RETURN' && selectedReturnFlight && (
            <FlightBlock flight={selectedReturnFlight} date={returnDate} label="Return" />
          )}
        </SectionCard>

        {/* Passenger Details */}
        <SectionCard icon="👥" title="Passengers" editTo="/passengers">
          {passengers.length === 0 ? (
            <p className="text-gray-400 text-sm">No passengers added</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500 text-xs">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium hidden md:table-cell">Gender</th>
                    <th className="pb-2 font-medium hidden md:table-cell">Nationality</th>
                  </tr>
                </thead>
                <tbody>
                  {passengers.map((p, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-medium text-gray-800">
                        {p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim()}
                      </td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                          ${p.category === 'ADULT' ? 'bg-blue-100 text-blue-700' : p.category === 'CHILD' ? 'bg-green-100 text-green-700' : 'bg-pink-100 text-pink-700'}`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="py-2 text-gray-600 hidden md:table-cell">{p.gender || '—'}</td>
                      <td className="py-2 text-gray-600 hidden md:table-cell">{p.nationality || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Add-Ons */}
        <SectionCard icon="🎒" title="Add-Ons" editTo="/addons">
          {addOns.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No add-ons selected</p>
          ) : (
            <div className="space-y-2 text-sm">
              {addOns.map((a, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-700">{a.description} × {a.quantity}</span>
                  <span className="font-medium text-gray-800">{formatPrice(a.total_price)}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Price Breakdown */}
        <SectionCard icon="💰" title="Price Breakdown">
          <div className="space-y-2 text-sm">
            {adults > 0 && <div className="flex justify-between"><span className="text-gray-600">Base Fare (Adults × {adults})</span><span>{formatPrice(adultFare)}</span></div>}
            {children > 0 && <div className="flex justify-between"><span className="text-gray-600">Base Fare (Children × {children})</span><span>{formatPrice(childFare)}</span></div>}
            {newborns > 0 && <div className="flex justify-between"><span className="text-gray-600">Base Fare (Newborns × {newborns})</span><span>{formatPrice(newbornFare)}</span></div>}
            {baggageAddons.length > 0 && <div className="flex justify-between"><span className="text-gray-600">Extra Baggage</span><span>{formatPrice(baggageAddons.reduce((s, a) => s + Number(a.total_price), 0))}</span></div>}
            {mealAddons.length > 0 && <div className="flex justify-between"><span className="text-gray-600">Meals</span><span>{formatPrice(mealAddons.reduce((s, a) => s + Number(a.total_price), 0))}</span></div>}
            {insuranceAddons.length > 0 && <div className="flex justify-between"><span className="text-gray-600">Insurance</span><span>{formatPrice(insuranceAddons.reduce((s, a) => s + Number(a.total_price), 0))}</span></div>}
            {seatAddons.length > 0 && <div className="flex justify-between"><span className="text-gray-600">Seat Selection</span><span>{formatPrice(seatAddons.reduce((s, a) => s + Number(a.total_price), 0))}</span></div>}
            <div className="border-t pt-2 flex justify-between"><span className="text-gray-600">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Taxes & Fees (18% GST)</span><span>{formatPrice(gst)}</span></div>
            <div className="border-t-2 border-gray-900 pt-3 flex justify-between items-center">
              <span className="font-bold text-gray-900 text-base">GRAND TOTAL</span>
              <span className="font-bold text-primary-700 text-2xl">{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </SectionCard>

        {/* Spacer for sticky bar */}
        <div className="h-4" />
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-xl py-4 px-6 z-30">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              data-testid="summary-confirm-checkbox"
              type="checkbox"
              checked={confirmed}
              onChange={e => { setConfirmed(e.target.checked); setTooltipVisible(false) }}
              className="w-4 h-4 flex-shrink-0"
            />
            <span className={`text-sm ${tooltipVisible && !confirmed ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
              I have reviewed all details and confirm they are correct.
            </span>
          </label>
          <div className="relative">
            <button
              data-testid="summary-confirm-pay-button"
              type="button"
              onClick={handleConfirmAndPay}
              className={`btn-primary px-8 py-3 text-base font-bold ${!confirmed ? 'opacity-60' : ''}`}
              title={!confirmed ? 'Please confirm your details to proceed' : ''}
              onMouseEnter={() => !confirmed && setTooltipVisible(true)}
              onMouseLeave={() => setTooltipVisible(false)}
            >
              Confirm & Pay {formatPrice(grandTotal)}
            </button>
            {tooltipVisible && !confirmed && (
              <div className="absolute bottom-full mb-2 right-0 bg-gray-800 text-white text-xs px-3 py-1.5 rounded whitespace-nowrap">
                Please confirm your details to proceed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
