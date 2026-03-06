export async function up(knex) {
  // Add unique constraint on flight_number so seeds can use ON CONFLICT
  await knex.schema.alterTable('flights', (table) => {
    table.unique(['flight_number']);
  });
}

export async function down(knex) {
  await knex.schema.alterTable('flights', (table) => {
    table.dropUnique(['flight_number']);
  });
}
