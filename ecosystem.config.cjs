module.exports = {
  apps: [
    {
      name: 'flightbooking-api',
      script: 'src/app.js',
      cwd: '/var/www/flight-booking/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'development',
        PORT: 5001
      },
      error_file: '/var/log/flight-booking/error.log',
      out_file: '/var/log/flight-booking/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
