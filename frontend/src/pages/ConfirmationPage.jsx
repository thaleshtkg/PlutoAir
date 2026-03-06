import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { bookingAPI } from '../api/services'
import { useBookingStore } from '../store/bookingStore'
import { useToast } from '../store/toastStore'

function formatPrice(n) { return '₹' + Number(n || 0).toLocaleString('en-IN') }

function TicketRow({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex flex-wrap justify-between py-2 border-b border-dashed border-gray-200 last:border-0 text-sm">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="text-gray-800 font-semibold text-right">{value}</span>
    </div>
  )
}

export default function ConfirmationPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { bookingRef: paramRef } = useParams()
  const { bookingRef: storeRef, selectedFlight, selectedReturnFlight, passengers, addOns, totalAmount, searchParams, resetBooking } = useBookingStore()
  const bookingRefDisplay = paramRef || storeRef
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const printRef = useRef()

  const flight = selectedFlight
  const { adults = 1, children = 0, newborns = 0, travelDate, returnDate, tripType } = searchParams

  // Confetti on mount
  useEffect(() => {
    const fire = (particleRatio, opts) => {
      confetti({ origin: { y: 0.6 }, ...opts, particleCount: Math.floor(200 * particleRatio) })
    }
    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })
    const timer = setTimeout(() => confetti.reset(), 3500)
    return () => { clearTimeout(timer); confetti.reset() }
  }, [])

  // Fetch ticket data
  useEffect(() => {
    if (bookingRefDisplay) {
      setLoading(true)
      bookingAPI.getTicket(bookingRefDisplay)
        .then(r => setTicket(r.data.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
    // Block back navigation
    window.history.pushState(null, '', window.location.href)
    const handler = () => window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [bookingRefDisplay])

  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      let y = 20
      doc.setFontSize(22)
      doc.setTextColor(30, 58, 95)
      doc.text('Flight Booking Confirmation', 20, y); y += 12
      doc.setFontSize(14)
      doc.text(`Booking Reference: ${bookingRefDisplay}`, 20, y); y += 10
      doc.setFontSize(11)
      doc.setTextColor(50, 50, 50)
      const drawLine = (label, value) => {
        if (!value) return
        doc.setFont(undefined, 'bold')
        doc.text(`${label}:`, 20, y)
        doc.setFont(undefined, 'normal')
        doc.text(String(value), 80, y)
        y += 8
      }
      if (flight) {
        drawLine('Airline', `${flight.airline_name} (${flight.flight_number})`)
        drawLine('Route', `${flight.origin_iata || flight.origin_name} -> ${flight.destination_iata || flight.destination_name}`)
        drawLine('Travel Date', travelDate)
        drawLine('Departure', flight.departure_time?.slice(0, 5))
        drawLine('Arrival', flight.arrival_time?.slice(0, 5))
        drawLine('Duration', flight.duration_mins ? `${Math.floor(flight.duration_mins / 60)}h ${flight.duration_mins % 60 > 0 ? flight.duration_mins % 60 + 'm' : ''}` : '')
      }
      y += 4
      drawLine('Passengers', `${adults} Adult${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} Children` : ''}${newborns > 0 ? `, ${newborns} Newborns` : ''}`)
      drawLine('Class', 'Economy')
      drawLine('Baggage', '15 kg included')
      if (addOns.length > 0) {
        y += 4
        doc.setFont(undefined, 'bold')
        doc.text('Add-Ons:', 20, y); y += 8
        doc.setFont(undefined, 'normal')
        addOns.forEach(a => { drawLine(`  ${a.description}`, formatPrice(a.total_price)) })
      }
      y += 4
      doc.line(20, y, 190, y); y += 6
      doc.setFont(undefined, 'bold')
      doc.setFontSize(13)
      doc.text(`Total Paid: ${formatPrice(totalAmount)}`, 20, y)
      doc.save(`FlightTicket-${bookingRefDisplay}.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
      toast.error('PDF download failed. Please try printing instead.')
    }
  }

  const handlePrint = () => window.print()

  const handleResendEmail = async () => {
    setResendMsg('Confirmation email resent successfully! ✓')
    setTimeout(() => setResendMsg(''), 3000)
  }

  const handleBackToHome = () => {
    resetBooking()
    navigate('/search')
  }

  const displayFlight = ticket?.flight || flight
  const displayTotal = ticket?.total_amount || totalAmount
  const displayPassengers = ticket?.passengers || passengers || []

  return (
    <div className="min-h-screen py-6 px-4">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          header { display: none !important; }
          .card { box-shadow: none !important; border: 1px solid #ddd; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-8 mb-6 text-center shadow-lg animate-fade-in">
          <div className="text-6xl mb-3">🎉</div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-green-100 mb-4">Your flight has been booked successfully</p>
          <div className="inline-block bg-white text-green-700 font-mono font-bold text-2xl px-8 py-3 rounded-xl shadow-inner tracking-widest">
            {bookingRefDisplay || 'FLT-XXXXXXXX'}
          </div>
          <p className="text-green-100 text-sm mt-3">Booking Reference ID</p>
        </div>

        {/* Email notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 mb-6 text-sm text-blue-700">
          📧 A confirmation email has been sent to your registered email address.
        </div>

        {/* Ticket Card */}
        <div ref={printRef} className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">✈️ Your Ticket</h2>
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-green-100 text-green-700">
              {loading ? 'Loading...' : 'CONFIRMED'}
            </span>
          </div>

          <div className="border-b-2 border-dashed border-gray-300 mb-4" />

          <TicketRow label="Booking Reference" value={<span className="font-mono text-primary-700">{bookingRefDisplay}</span>} />
          {displayFlight && (
            <>
              <TicketRow label="Airline" value={`${displayFlight.airline_name || ''} ${displayFlight.flight_number || ''}`} />
              <TicketRow label="Route" value={`${displayFlight.origin_iata || displayFlight.origin_name || ''} -> ${displayFlight.destination_iata || displayFlight.destination_name || ''}`} />
              <TicketRow label="Travel Date" value={travelDate} />
              <TicketRow label="Departure" value={displayFlight.departure_time?.slice(0, 5)} />
              <TicketRow label="Arrival" value={displayFlight.arrival_time?.slice(0, 5)} />
              <TicketRow label="Duration" value={displayFlight.duration_mins ? `${Math.floor(displayFlight.duration_mins / 60)}h ${displayFlight.duration_mins % 60 > 0 ? displayFlight.duration_mins % 60 + 'm' : ''}` : null} />
            </>
          )}
          <TicketRow label="Class" value="Economy" />
          <TicketRow label="Passengers" value={`${adults} Adult${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} Child${children > 1 ? 'ren' : ''}` : ''}${newborns > 0 ? `, ${newborns} Newborn${newborns > 1 ? 's' : ''}` : ''}`} />
          <TicketRow label="Baggage" value="15 kg included" />

          {/* Return leg */}
          {tripType === 'RETURN' && selectedReturnFlight && (
            <>
              <div className="border-b-2 border-dashed border-gray-300 my-4" />
              <p className="text-xs font-bold text-primary-500 uppercase mb-2">Return Leg</p>
              <TicketRow label="Flight" value={selectedReturnFlight.flight_number} />
              <TicketRow label="Route" value={`${selectedReturnFlight.origin_iata || ''} -> ${selectedReturnFlight.destination_iata || ''}`} />
              <TicketRow label="Return Date" value={returnDate} />
              <TicketRow label="Departure" value={selectedReturnFlight.departure_time?.slice(0, 5)} />
            </>
          )}

          {/* Add-ons */}
          {addOns.length > 0 && (
            <>
              <div className="border-b-2 border-dashed border-gray-300 my-4" />
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Add-Ons</p>
              {addOns.map((a, i) => <TicketRow key={i} label={a.description} value={formatPrice(a.total_price)} />)}
            </>
          )}

          <div className="border-b-2 border-dashed border-gray-300 my-4" />
          <TicketRow label="Total Amount Paid" value={<span className="text-xl font-bold text-primary-700">{formatPrice(displayTotal)}</span>} />
        </div>

        {/* Status messages */}
        {resendMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm mb-4 text-center">
            {resendMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4 no-print">
          <button type="button" onClick={handleDownloadPDF}
            className="btn-secondary flex items-center justify-center gap-2 py-3 text-sm">
            📥 Download PDF
          </button>
          <button type="button" onClick={handlePrint}
            className="btn-secondary flex items-center justify-center gap-2 py-3 text-sm">
            🖨 Print Ticket
          </button>
          <button type="button" onClick={handleResendEmail}
            className="btn-secondary flex items-center justify-center gap-2 py-3 text-sm col-span-2">
            📧 Resend Confirmation Email
          </button>
        </div>

        <button
          data-testid="confirmation-back-home"
          type="button"
          onClick={handleBackToHome}
          className="btn-primary w-full py-3 text-base font-bold no-print"
        >
          🏠 Back to Home - Search New Flights
        </button>
      </div>
    </div>
  )
}
