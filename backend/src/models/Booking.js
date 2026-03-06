import db from '../db/connection.js';

// Generate booking reference (FLT-XXXXXXXX format)
const generateBookingRef = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'FLT-';
  for (let i = 0; i < 8; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
};

export class Booking {
  static async create(bookingData) {
    const [booking] = await db('bookings')
      .insert({
        booking_ref: generateBookingRef(),
        user_id: bookingData.user_id || null,
        flight_id: bookingData.flight_id,
        return_flight_id: bookingData.return_flight_id || null,
        travel_date: bookingData.travel_date,
        return_date: bookingData.return_date || null,
        trip_type: bookingData.trip_type,
        total_amount: bookingData.total_amount || 0,
        status: 'PENDING',
      })
      .returning('*');

    return booking;
  }

  static async findById(id) {
    return db('bookings').where({ id }).first();
  }

  static async findByRef(bookingRef) {
    return db('bookings').where({ booking_ref: bookingRef }).first();
  }

  static async findByUserId(userId) {
    return db('bookings').where({ user_id: userId }).select('*');
  }

  static async updateStatus(id, status) {
    return db('bookings').where({ id }).update({ status, updated_at: new Date() });
  }

  static async updateTotalAmount(id, amount) {
    return db('bookings').where({ id }).update({ total_amount: amount });
  }

  static async delete(id) {
    return db('bookings').where({ id }).delete();
  }
}

export class Passenger {
  static async create(passengerData) {
    const [passenger] = await db('passengers')
      .insert({
        booking_id: passengerData.booking_id,
        full_name: passengerData.full_name,
        age_category: passengerData.age_category,
        date_of_birth: passengerData.date_of_birth,
        gender: passengerData.gender,
        nationality: passengerData.nationality,
        passport_id: passengerData.passport_id || null,
        seat_number: passengerData.seat_number || null,
      })
      .returning('*');

    return passenger;
  }

  static async findByBookingId(bookingId) {
    return db('passengers').where({ booking_id: bookingId }).select('*');
  }

  static async updateSeat(id, seatNumber) {
    return db('passengers').where({ id }).update({ seat_number: seatNumber });
  }
}

export class BookingAddOn {
  static async create(addonData) {
    const [addon] = await db('booking_addons')
      .insert({
        booking_id: addonData.booking_id,
        addon_type: addonData.addon_type,
        description: addonData.description,
        quantity: addonData.quantity,
        unit_price: addonData.unit_price,
        total_price: addonData.total_price,
      })
      .returning('*');

    return addon;
  }

  static async findByBookingId(bookingId) {
    return db('booking_addons').where({ booking_id: bookingId }).select('*');
  }

  static async deleteByBookingId(bookingId) {
    return db('booking_addons').where({ booking_id: bookingId }).delete();
  }
}

export class Payment {
  static async create(paymentData) {
    const [payment] = await db('payments')
      .insert({
        booking_id: paymentData.booking_id,
        payment_method: paymentData.payment_method,
        amount: paymentData.amount,
        transaction_ref: paymentData.transaction_ref || null,
        status: 'PENDING',
      })
      .returning('*');

    return payment;
  }

  static async findByBookingId(bookingId) {
    return db('payments').where({ booking_id: bookingId }).first();
  }

  static async updateStatus(id, status) {
    return db('payments').where({ id }).update({ status });
  }

  static async findByTransactionRef(transactionRef) {
    return db('payments').where({ transaction_ref: transactionRef }).first();
  }

  static async getByBookingId(bookingId) {
    return db('payments').where({ booking_id: bookingId }).first();
  }
}
