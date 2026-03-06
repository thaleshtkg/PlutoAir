export async function up(knex) {
  return knex.schema.createTable('bookings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('booking_ref', 10).notNullable().unique();
    table.uuid('user_id').references('id').inTable('users');
    table.uuid('flight_id').notNullable().references('id').inTable('flights');
    table.uuid('return_flight_id').references('id').inTable('flights');
    table.date('travel_date').notNullable();
    table.date('return_date');
    table.enum('trip_type', ['ONE_WAY', 'RETURN']).defaultTo('ONE_WAY');
    table.decimal('total_amount', 10, 2);
    table.enum('status', ['PENDING', 'CONFIRMED', 'CANCELLED']).defaultTo('PENDING');
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('bookings');
}
