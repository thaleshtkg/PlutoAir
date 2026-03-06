import { Booking, Passenger, BookingAddOn, Payment } from '../models/Booking.js';
import { Flight } from '../models/Flight.js';
import { httpResponses } from '../utils/responseFormat.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const bookingController = {
  createBooking: asyncHandler(async (req, res) => {
    const { flight_id, return_flight_id, travel_date, return_date, trip_type, passenger_count, adults, children, newborns } = req.body;

    if (!flight_id || !travel_date || !trip_type) {
      return httpResponses.badRequest(res, 'Missing required booking fields');
    }

    if (trip_type === 'RETURN' && !return_flight_id) {
      return httpResponses.badRequest(res, 'Return flight required for return trips');
    }

    // Verify flights exist
    const flight = await Flight.findById(flight_id);
    if (!flight) {
      return httpResponses.notFound(res, 'Flight not found');
    }

    let returnFlight = null;
    if (return_flight_id) {
      returnFlight = await Flight.findById(return_flight_id);
      if (!returnFlight) {
        return httpResponses.notFound(res, 'Return flight not found');
      }
    }

    // Calculate initial base fare.
    const derivedPassengerCount =
      Number(passenger_count) ||
      (Number(adults || 0) + Number(children || 0) + Number(newborns || 0)) ||
      1;
    const baseFare = Number(flight.base_price_adult) * derivedPassengerCount;

    const isUuid = (value) =>
      typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

    // Create booking
    const booking = await Booking.create({
      // Guest/demo identities are not UUIDs; keep user_id nullable for those sessions.
      user_id: isUuid(req.user?.id) ? req.user.id : null,
      flight_id,
      return_flight_id,
      travel_date,
      return_date,
      trip_type,
      total_amount: baseFare,
    });

    return httpResponses.created(res, booking, 'Booking created successfully');
  }),

  getBooking: asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return httpResponses.notFound(res, 'Booking not found');
    }

    // Verify ownership
    if (booking.user_id && booking.user_id !== req.user.id && !req.user.is_admin) {
      return httpResponses.forbidden(res, 'Unauthorized access to this booking');
    }

    return httpResponses.ok(res, booking);
  }),

  addPassengers: asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { passengers } = req.body;

    if (!Array.isArray(passengers) || passengers.length === 0) {
      return httpResponses.badRequest(res, 'At least one passenger is required');
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return httpResponses.notFound(res, 'Booking not found');
    }

    // Create passengers
    const createdPassengers = [];
    for (const passengerData of passengers) {
      const passenger = await Passenger.create({
        booking_id: bookingId,
        ...passengerData,
        // Accept both frontend key (`dob`) and backend key (`date_of_birth`).
        date_of_birth: passengerData.date_of_birth || passengerData.dob,
      });
      createdPassengers.push(passenger);
    }

    return httpResponses.ok(res, { passengers: createdPassengers }, 'Passengers added successfully');
  }),

  addAddOns: asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { addons } = req.body;

    if (!Array.isArray(addons)) {
      return httpResponses.badRequest(res, 'Add-ons must be an array');
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return httpResponses.notFound(res, 'Booking not found');
    }

    const existingAddons = await BookingAddOn.findByBookingId(bookingId);
    const existingAddOnTotal = existingAddons.reduce((sum, item) => sum + Number(item.total_price || 0), 0);

    // Delete existing add-ons
    await BookingAddOn.deleteByBookingId(bookingId);

    // Add new add-ons
    let totalAddOnCost = 0;
    const createdAddons = [];

    for (const addon of addons) {
      const addonRecord = await BookingAddOn.create({
        booking_id: bookingId,
        ...addon,
      });
      totalAddOnCost += addon.total_price || 0;
      createdAddons.push(addonRecord);
    }

    // Update booking total amount (base + add-ons + 18% GST).
    const baseFare = Math.max(0, Number(booking.total_amount || 0) - existingAddOnTotal);
    const subtotal = baseFare + totalAddOnCost;
    const gst = Math.round(subtotal * 0.18);
    const newTotal = subtotal + gst;
    await Booking.updateTotalAmount(bookingId, newTotal);

    return httpResponses.ok(res, { addons: createdAddons }, 'Add-ons updated successfully');
  }),

  getSummary: asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return httpResponses.notFound(res, 'Booking not found');
    }

    const passengers = await Passenger.findByBookingId(bookingId);
    const addons = await BookingAddOn.findByBookingId(bookingId);
    const flight = await Flight.findById(booking.flight_id);
    let returnFlight = null;

    if (booking.return_flight_id) {
      returnFlight = await Flight.findById(booking.return_flight_id);
    }

    const summary = {
      booking,
      flight,
      returnFlight,
      passengers,
      addons,
    };

    return httpResponses.ok(res, summary);
  }),

  confirmBooking: asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return httpResponses.notFound(res, 'Booking not found');
    }

    if (booking.status !== 'PENDING') {
      return httpResponses.badRequest(res, 'Booking has already been confirmed or cancelled');
    }

    await Booking.updateStatus(bookingId, 'CONFIRMED');

    return httpResponses.ok(res, { booking_ref: booking.booking_ref }, 'Booking confirmed successfully');
  }),

  getTicket: asyncHandler(async (req, res) => {
    const { bookingRef } = req.params;

    const booking = await Booking.findByRef(bookingRef);
    if (!booking) {
      return httpResponses.notFound(res, 'Booking not found');
    }

    const passengers = await Passenger.findByBookingId(booking.id);
    const addons = await BookingAddOn.findByBookingId(booking.id);
    const flight = await Flight.findById(booking.flight_id);
    let returnFlight = null;

    if (booking.return_flight_id) {
      returnFlight = await Flight.findById(booking.return_flight_id);
    }

    const ticket = {
      booking_ref: booking.booking_ref,
      booking_date: booking.created_at,
      passengers,
      flight,
      returnFlight,
      addons,
      total_amount: booking.total_amount,
      status: booking.status,
    };

    return httpResponses.ok(res, ticket);
  }),
};
