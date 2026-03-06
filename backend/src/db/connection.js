import knex from 'knex';
import knexConfig from '../../knexfile.js';

const env = process.env.NODE_ENV || 'development';
const resolvedConfig = knexConfig[env] || knexConfig.development;
const db = knex(resolvedConfig);

// Test the connection
db.raw('SELECT 1')
  .then(() => {
    console.log('✓ Database connection established');
  })
  .catch((err) => {
    console.error('✗ Database connection failed:', err.message);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  });

export default db;
