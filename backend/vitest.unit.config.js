import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

const nm = (pkg) => resolve('./node_modules', pkg)

export default defineConfig({
  resolve: {
    alias: {
      // Map all backend packages to their absolute paths so tests outside
      // the backend/ Vite root can resolve them correctly
      'express': nm('express'),
      'supertest': nm('supertest'),
      'jsonwebtoken': nm('jsonwebtoken'),
      'bcryptjs': nm('bcryptjs'),
      'cors': nm('cors'),
      'joi': nm('joi'),
      'uuid': nm('uuid'),
      'dotenv': nm('dotenv'),
      'knex': nm('knex'),
      'pg': nm('pg'),
      'redis': nm('redis'),
      'axios': nm('axios'),
      'nodemailer': nm('nodemailer'),
    },
  },
  test: {
    globals: false,
    environment: 'node',
    include: [
      '../AutomationTests/UnitTests/Backend/**/*.test.js',
    ],
    server: {
      deps: {
        // Force these packages through Vite's transform so resolve.alias applies.
        // Needed because test files live outside the backend/ Vite root.
        inline: [
          'express',
          'supertest',
          'jsonwebtoken',
          'bcryptjs',
          'cors',
          'joi',
          'uuid',
          'dotenv',
          'knex',
          'pg',
          'redis',
          'axios',
          'nodemailer',
        ],
      },
    },
  },
})
