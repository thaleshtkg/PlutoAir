import db from '../db/connection.js';

export class City {
  static async findAll() {
    return db('cities').select('*');
  }

  static async findById(id) {
    return db('cities').where({ id }).first();
  }
}

export class Airline {
  static async findAll() {
    return db('airlines').select('*');
  }

  static async findById(id) {
    return db('airlines').where({ id }).first();
  }
}

export class Flight {
  static async search(filters) {
    // Convert travel_date (YYYY-MM-DD) to 3-letter day abbreviation used in available_days
    const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    const travelDay = DAY_NAMES[new Date(filters.travel_date).getDay()]

    let query = db('flights')
      .where({ origin_id: filters.origin_id, destination_id: filters.destination_id })
      .whereRaw("available_days ILIKE ?", [`%${travelDay}%`])
      .where('available_seats', '>', 0);

    if (filters.airline_id) query = query.where({ airline_id: filters.airline_id });
    if (filters.min_price)  query = query.where('base_price_adult', '>=', filters.min_price);
    if (filters.max_price)  query = query.where('base_price_adult', '<=', filters.max_price);

    const flights = await query.select('*');

    // Flatten airline + city fields so the frontend can read them directly
    return Promise.all(
      flights.map(async (flight) => {
        const airline     = await Airline.findById(flight.airline_id);
        const origin      = await City.findById(flight.origin_id);
        const destination = await City.findById(flight.destination_id);

        return {
          ...flight,
          // Flat convenience fields used by the frontend
          airline_name:       airline?.name,
          airline_iata:       airline?.iata_code,
          origin_name:        origin?.name,
          origin_iata:        origin?.iata_code,
          destination_name:   destination?.name,
          destination_iata:   destination?.iata_code,
          // Keep nested objects too for detail views
          airline,
          origin,
          destination,
        };
      })
    );
  }

  static async findById(id) {
    const flight = await db('flights').where({ id }).first();
    if (!flight) return null;

    const airline     = await Airline.findById(flight.airline_id);
    const origin      = await City.findById(flight.origin_id);
    const destination = await City.findById(flight.destination_id);

    return {
      ...flight,
      airline_name:       airline?.name,
      airline_iata:       airline?.iata_code,
      origin_name:        origin?.name,
      origin_iata:        origin?.iata_code,
      destination_name:   destination?.name,
      destination_iata:   destination?.iata_code,
      airline,
      origin,
      destination,
    };
  }

  static async updateAvailableSeats(flightId, count) {
    return db('flights').where({ id: flightId }).update({
      available_seats: db.raw('available_seats - ?', [count]),
    });
  }
}

export class Booking {
  static async create(bookingData) {
    const [booking] = await db('bookings')
      .insert({
        booking_ref: this.generateBookingRef(),
        user_id: bookingData.user_id,
        flight_id: bookingData.flight_id,
        return_flight_id: bookingData.return_flight_id || null,
        travel_date: bookingData.travel_date,
        return_date: bookingData.return_date || null,
        trip_type: bookingData.trip_type || 'ONE_WAY',
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

  static async updateStatus(id, status) {
    return db('bookings').where({ id }).update({ status });
  }

  static async updateTotalAmount(id, amount) {
    return db('bookings').where({ id }).update({ total_amount: amount });
  }

  static generateBookingRef() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let ref = 'FLT-';
    for (let i = 0; i < 8; i++) {
      ref += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return ref;
  }
}
