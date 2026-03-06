export async function up(knex) {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('full_name', 100).notNullable();
    table.string('email', 150).notNullable().unique();
    table.string('mobile', 15);
    table.text('password_hash').notNullable();
    table.boolean('is_guest').defaultTo(false);
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('users');
}
