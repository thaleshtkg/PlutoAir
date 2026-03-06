import { City, Airline, Flight } from '../models/Flight.js';
import { httpResponses } from '../utils/responseFormat.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const flightController = {
  getCities: asyncHandler(async (req, res) => {
    const cities = await City.findAll();
    return httpResponses.ok(res, cities);
  }),

  getAirlines: asyncHandler(async (req, res) => {
    const airlines = await Airline.findAll();
    return httpResponses.ok(res, airlines);
  }),

  searchFlights: asyncHandler(async (req, res) => {
    const { origin_id, destination_id, travel_date, airline_id, min_price, max_price } = req.body;

    if (!origin_id || !destination_id || !travel_date) {
      return httpResponses.badRequest(res, 'origin_id, destination_id, and travel_date are required');
    }

    const travelDate = new Date(travel_date);
    if (Number.isNaN(travelDate.getTime())) {
      return httpResponses.badRequest(res, 'travel_date must be a valid date');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (travelDate < today) {
      return httpResponses.badRequest(res, 'Travel date must not be in the past');
    }

    const flights = await Flight.search({
      origin_id,
      destination_id,
      travel_date,
      airline_id,
      min_price,
      max_price,
    });

    // Return the array directly (consistent with getCities)
    return httpResponses.ok(res, flights);
  }),

  getFlightDetails: asyncHandler(async (req, res) => {
    const { id } = req.params;

    const flight = await Flight.findById(id);
    if (!flight) {
      return httpResponses.notFound(res, 'Flight not found');
    }

    return httpResponses.ok(res, flight);
  }),
};
