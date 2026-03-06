import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['AutomationTests/InfraTests/**/*.test.js'],
    // Give network/DB checks more time
    testTimeout: 15000,
    hookTimeout: 10000,
    // Never shuffle — infra checks run in dependency order
    sequence: { shuffle: false },
    reporter: ['verbose'],
  },
})
