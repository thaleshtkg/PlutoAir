export async function up(knex) {
  return knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('booking_id').notNullable().references('id').inTable('bookings');
    table.enum('payment_method', ['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'UPI']).defaultTo('CREDIT_CARD');
    table.decimal('amount', 10, 2).notNullable();
    table.string('transaction_ref', 50);
    table.enum('status', ['PENDING', 'SUCCESS', 'FAILED']).defaultTo('PENDING');
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('payments');
}
