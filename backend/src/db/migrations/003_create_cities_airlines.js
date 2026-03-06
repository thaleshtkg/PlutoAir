export async function up(knex) {
  return knex.schema
    .createTable('cities', (table) => {
      table.increments('id').primary();
      table.string('name', 100).notNullable();
      table.string('iata_code', 3).notNullable().unique();
      table.string('country', 100);
      table.string('timezone', 50);
      table.timestamps(true, true);
    })
    .createTable('airlines', (table) => {
      table.increments('id').primary();
      table.string('name', 100).notNullable();
      table.string('iata_code', 2).notNullable().unique();
      table.text('logo_url');
      table.timestamps(true, true);
    });
}

export async function down(knex) {
  return knex.schema
    .dropTableIfExists('airlines')
    .dropTableIfExists('cities');
}
