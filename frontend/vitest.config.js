import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const nm = (pkg) => resolve('./node_modules', pkg)

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      // Map testing-library and framework packages to frontend/node_modules
      // so tests outside frontend/ can find them
      '@testing-library/react': nm('@testing-library/react'),
      '@testing-library/user-event': nm('@testing-library/user-event'),
      '@testing-library/jest-dom': nm('@testing-library/jest-dom'),
      'react-router-dom': nm('react-router-dom'),
      'react/jsx-dev-runtime': nm('react/jsx-dev-runtime'),
      'react/jsx-runtime': nm('react/jsx-runtime'),
      'react-dom/client': nm('react-dom/client'),
      'react-dom': nm('react-dom'),
      'react': nm('react'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: [
      '../AutomationTests/UnitTests/Frontend/**/*.{test,spec}.{js,jsx}',
      '../AutomationTests/IntegrationTests/Frontend/**/*.{test,spec}.{js,jsx}',
    ],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/test/**', 'src/__tests__/**', 'src/main.jsx'],
    },
  },
})
