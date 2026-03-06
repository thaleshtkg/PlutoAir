export async function up(knex) {
  await knex.schema.alterTable('bookings', (table) => {
    table.string('booking_ref', 12).notNullable().alter();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('bookings', (table) => {
    table.string('booking_ref', 10).notNullable().alter();
  });
}
