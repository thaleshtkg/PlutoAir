import db from '../../src/db/connection.js';

const TABLES = [
  'payments',
  'booking_addons',
  'passengers',
  'bookings',
  'flights',
  'airlines',
  'cities',
  'guest_login_attempts',
  'users',
];

export const resetSeedData = async () => {
  await db.raw(`TRUNCATE TABLE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`);
  await db.seed.run();
};

export const beginTestTransaction = async () => {
  await db.raw('BEGIN');
};

export const rollbackTestTransaction = async () => {
  await db.raw('ROLLBACK');
};

export const closeDb = async () => {
  await db.destroy();
};
