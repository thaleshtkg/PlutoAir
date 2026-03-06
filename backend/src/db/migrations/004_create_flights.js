export async function up(knex) {
  return knex.schema.createTable('flights', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.integer('airline_id').notNullable().references('id').inTable('airlines');
    table.string('flight_number', 10).notNullable();
    table.integer('origin_id').notNullable().references('id').inTable('cities');
    table.integer('destination_id').notNullable().references('id').inTable('cities');
    table.time('departure_time').notNullable();
    table.time('arrival_time').notNullable();
    table.integer('duration_mins').notNullable();
    table.decimal('base_price_adult', 10, 2).notNullable();
    table.decimal('base_price_child', 10, 2).notNullable();
    table.decimal('base_price_newborn', 10, 2).notNullable();
    table.string('available_days', 50);
    table.integer('total_seats').defaultTo(180);
    table.integer('available_seats').defaultTo(180);
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('flights');
}
