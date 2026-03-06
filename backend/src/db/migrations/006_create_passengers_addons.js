export async function up(knex) {
  return knex.schema
    .createTable('passengers', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('booking_id').notNullable().references('id').inTable('bookings');
      table.string('full_name', 100).notNullable();
      table.enum('age_category', ['ADULT', 'CHILD', 'NEWBORN']).notNullable();
      table.date('date_of_birth').notNullable();
      table.string('gender', 10);
      table.string('nationality', 100);
      table.string('passport_id', 50);
      table.string('seat_number', 5);
      table.timestamps(true, true);
    })
    .createTable('booking_addons', (table) => {
      table.increments('id').primary();
      table.uuid('booking_id').notNullable().references('id').inTable('bookings');
      table.string('addon_type', 50).notNullable();
      table.text('description');
      table.integer('quantity').defaultTo(1);
      table.decimal('unit_price', 10, 2).notNullable();
      table.decimal('total_price', 10, 2).notNullable();
      table.timestamps(true, true);
    });
}

export async function down(knex) {
  return knex.schema
    .dropTableIfExists('booking_addons')
    .dropTableIfExists('passengers');
}
