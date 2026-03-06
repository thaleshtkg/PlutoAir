export async function seed(knex) {
  const cities = [
    { name: 'New Delhi', iata_code: 'DEL', country: 'India', timezone: 'Asia/Kolkata' },
    { name: 'Mumbai', iata_code: 'BOM', country: 'India', timezone: 'Asia/Kolkata' },
    { name: 'Bangalore', iata_code: 'BLR', country: 'India', timezone: 'Asia/Kolkata' },
    { name: 'Hyderabad', iata_code: 'HYD', country: 'India', timezone: 'Asia/Kolkata' },
    { name: 'Pune', iata_code: 'PNQ', country: 'India', timezone: 'Asia/Kolkata' },
    { name: 'Jaipur', iata_code: 'JAI', country: 'India', timezone: 'Asia/Kolkata' },
    { name: 'Chennai', iata_code: 'MAA', country: 'India', timezone: 'Asia/Kolkata' },
    { name: 'Kolkata', iata_code: 'CCU', country: 'India', timezone: 'Asia/Kolkata' },
    { name: 'Ahmedabad', iata_code: 'AMD', country: 'India', timezone: 'Asia/Kolkata' },
    { name: 'Goa', iata_code: 'GOI', country: 'India', timezone: 'Asia/Kolkata' },
    { name: 'New York', iata_code: 'JFK', country: 'USA', timezone: 'America/New_York' },
    { name: 'London', iata_code: 'LHR', country: 'UK', timezone: 'Europe/London' },
    { name: 'Paris', iata_code: 'CDG', country: 'France', timezone: 'Europe/Paris' },
    { name: 'Berlin', iata_code: 'BER', country: 'Germany', timezone: 'Europe/Berlin' },
    { name: 'Chicago', iata_code: 'ORD', country: 'USA', timezone: 'America/Chicago' },
    { name: 'Moscow', iata_code: 'SVO', country: 'Russia', timezone: 'Europe/Moscow' },
    { name: 'Beijing', iata_code: 'PEK', country: 'China', timezone: 'Asia/Shanghai' },
    { name: 'Tokyo', iata_code: 'NRT', country: 'Japan', timezone: 'Asia/Tokyo' },
    { name: 'Dubai', iata_code: 'DXB', country: 'UAE', timezone: 'Asia/Dubai' },
    { name: 'Singapore', iata_code: 'SIN', country: 'Singapore', timezone: 'Asia/Singapore' },
  ];

  await knex('cities').insert(cities).onConflict('iata_code').ignore();
  console.log('✓ Cities seeded (skipped duplicates)');
}
