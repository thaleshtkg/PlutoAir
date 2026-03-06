export async function seed(knex) {
  const cities = await knex('cities').select('id', 'iata_code').orderBy('id');
  const airlines = await knex('airlines').select('id', 'iata_code').orderBy('id');

  const allDays = 'MON,TUE,WED,THU,FRI,SAT,SUN';
  const departureSlots = [360, 600, 840, 1080]; // 06:00, 10:00, 14:00, 18:00
  const airlineCycle = airlines.slice(0, 6); // keep variety but bounded
  const airlineCounters = Object.fromEntries(airlineCycle.map((a) => [a.iata_code, 100]));

  const minutesToTime = (mins) => {
    const m = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    return `${hh}:${mm}:00`;
  };

  const estimateDuration = (originId, destinationId) => {
    const distanceFactor = Math.abs(originId - destinationId);
    return 70 + distanceFactor * 22; // deterministic static duration
  };

  const computeBaseAdultFare = (originId, destinationId, slotIdx) => {
    const distanceFactor = Math.abs(originId - destinationId);
    return 2200 + distanceFactor * 275 + slotIdx * 180;
  };

  const nextFlightNumber = (iata) => {
    const current = airlineCounters[iata];
    airlineCounters[iata] += 1;
    return `${iata}-${current}`;
  };

  const flights = [];

  for (let originIdx = 0; originIdx < cities.length; originIdx += 1) {
    for (let destinationIdx = 0; destinationIdx < cities.length; destinationIdx += 1) {
      if (originIdx === destinationIdx) continue;

      const origin = cities[originIdx];
      const destination = cities[destinationIdx];
      const routeSeed = origin.id * 100 + destination.id;

      // Two daily flights per route gives consistent options for every valid search.
      for (let variant = 0; variant < 2; variant += 1) {
        const airline = airlineCycle[(routeSeed + variant) % airlineCycle.length];
        const departureBase = departureSlots[(routeSeed + variant) % departureSlots.length];
        const duration = estimateDuration(origin.id, destination.id) + variant * 20;
        const departure = departureBase + ((routeSeed % 5) * 5);
        const arrival = departure + duration;

        const adult = computeBaseAdultFare(origin.id, destination.id, variant);
        const child = Math.round(adult * 0.6);
        const newborn = Math.max(400, Math.round(adult * 0.15));
        const totalSeats = 180 + ((routeSeed + variant) % 4) * 20;
        const availableSeats = totalSeats - ((routeSeed + variant) % 25);

        flights.push({
          airline_id: airline.id,
          flight_number: nextFlightNumber(airline.iata_code),
          origin_id: origin.id,
          destination_id: destination.id,
          departure_time: minutesToTime(departure),
          arrival_time: minutesToTime(arrival),
          duration_mins: duration,
          base_price_adult: adult,
          base_price_child: child,
          base_price_newborn: newborn,
          available_days: allDays,
          total_seats: totalSeats,
          available_seats: Math.max(20, availableSeats),
        });
      }
    }
  }

  await knex('flights')
    .insert(flights)
    .onConflict('flight_number')
    .merge();

  console.log(`✓ Flights seeded/updated (${flights.length} routes records)`);
}
