export async function seed(knex) {
  const airlines = [
    { name: 'IndiGo', iata_code: '6E', logo_url: 'https://via.placeholder.com/100?text=IndiGo' },
    { name: 'Air India', iata_code: 'AI', logo_url: 'https://via.placeholder.com/100?text=Air+India' },
    { name: 'Vistara', iata_code: 'UK', logo_url: 'https://via.placeholder.com/100?text=Vistara' },
    { name: 'SpiceJet', iata_code: 'SG', logo_url: 'https://via.placeholder.com/100?text=SpiceJet' },
    { name: 'GoFirst', iata_code: 'G8', logo_url: 'https://via.placeholder.com/100?text=GoFirst' },
    { name: 'Emirates', iata_code: 'EK', logo_url: 'https://via.placeholder.com/100?text=Emirates' },
    { name: 'British Airways', iata_code: 'BA', logo_url: 'https://via.placeholder.com/100?text=British+Airways' },
    { name: 'Lufthansa', iata_code: 'LH', logo_url: 'https://via.placeholder.com/100?text=Lufthansa' },
    { name: 'Singapore Airlines', iata_code: 'SQ', logo_url: 'https://via.placeholder.com/100?text=Singapore+Airlines' },
    { name: 'Air France', iata_code: 'AF', logo_url: 'https://via.placeholder.com/100?text=Air+France' },
  ];

  await knex('airlines').insert(airlines).onConflict('iata_code').ignore();
  console.log('✓ Airlines seeded (skipped duplicates)');
}
