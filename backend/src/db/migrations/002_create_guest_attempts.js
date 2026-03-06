export async function up(knex) {
  return knex.schema.createTable('guest_login_attempts', (table) => {
    table.increments('id').primary();
    table.string('identifier', 200).notNullable().unique();
    table.integer('attempt_count').defaultTo(0);
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('guest_login_attempts');
}
