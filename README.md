# Flight Booking System - Setup & Run Guide

Complete flight booking application built with React, Node.js, PostgreSQL, and designed for comprehensive QA testing.

## 🪟 Windows Users ⚠️

**If you're on Windows**, please read: **[WINDOWS_DEPLOYMENT.md](./WINDOWS_DEPLOYMENT.md)**

The commands below use bash syntax. Windows PowerShell is different!

**Quick Windows fix:**
- `&&` → `;` (PowerShell uses semicolon)
- `docker-compose` → `docker compose` (modern Docker)
- `lsof` → `netstat` (Windows equivalent)

Read WINDOWS_DEPLOYMENT.md for complete Windows instructions.

## 🚀 Quick Start (Linux/Mac)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- npm or yarn

### 1. Start Database & Cache (Docker)

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run migrations
npm run migrate

# Seed sample data
npm run seed

# Start development server
npm run dev
```

Server runs on: **http://localhost:5000**

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

App runs on: **http://localhost:5173**

## 🔑 Default Credentials

**Guest Access (20 free sessions):**
- Username: `admin`
- Password: `admin@123`

## 📚 Project Structure

### Backend
```
backend/
├── src/
│   ├── controllers/      # Business logic
│   ├── models/          # Data access layer
│   ├── routes/          # API routes
│   ├── middleware/      # Auth, validation, error handling
│   ├── services/        # Email service
│   ├── db/
│   │   ├── migrations/  # Database schema
│   │   └── seeds/       # Sample data
│   └── app.js           # Express app entry point
├── knexfile.js          # Database config
└── package.json
```

### Frontend
```
frontend/
├── src/
│   ├── pages/           # Route components
│   ├── components/      # Reusable components
│   ├── store/           # Zustand state management
│   ├── api/             # API client & services
│   ├── index.css        # Global styles
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS config
└── package.json
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login           # User login
POST   /api/auth/register        # New user registration
POST   /api/auth/logout          # User logout
POST   /api/auth/refresh         # Refresh access token
GET    /api/auth/me              # Get current user
POST   /api/auth/guest-check     # Check guest session limit
```

### Flights
```
GET    /api/flights/cities       # List all cities
GET    /api/flights/airlines     # List all airlines
POST   /api/flights/search       # Search flights
GET    /api/flights/:id          # Get flight details
```

### Bookings
```
POST   /api/booking              # Create new booking
GET    /api/booking/:id          # Get booking details
POST   /api/booking/:id/passengers    # Add passengers
POST   /api/booking/:id/addons        # Add extras (meals, baggage, etc)
GET    /api/booking/:id/summary       # Get booking summary
POST   /api/booking/:id/confirm       # Confirm booking
GET    /api/booking/ticket/:ref       # Get ticket details
```

### Payments
```
POST   /api/payment/initiate     # Start payment process
POST   /api/payment/callback     # Handle payment callback
GET    /api/payment/dummy-bank   # Dummy bank payment page
GET    /api/payment/:id/status   # Check payment status
```

## 🧪 Testing

### Backend Testing
```bash
cd backend

# Run unit tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### Frontend Testing
```bash
cd frontend

# Run E2E tests
npm run test:e2e

# Run unit tests
npm run test

# Run tests with coverage
npm run test -- --coverage
```

## 📋 User Flows

### 1. Authentication
1. User logs in with `admin`/`admin@123` (guest) or creates account
2. System issues JWT access token
3. Token stored in localStorage

### 2. Flight Booking
1. Search flights (origin, destination, dates, passengers)
2. Select outbound flight
3. Select return flight (if applicable)
4. Add passenger details
5. Select add-ons (meals, baggage, seats, insurance)
6. Review booking summary
7. Process payment
8. Get confirmation with booking reference

### 3. Session Management
- Session duration: 60 minutes
- Auto-refresh tokens when expired
- Warning shown at 5 minutes remaining
- Automatic logout after timeout

## 🎨 Features

### Frontend
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Real-time form validation
- ✅ Error handling & user feedback
- ✅ Session timeout with extended session option
- ✅ Loading states & skeleton screens
- ✅ Confetti animation on success
- ✅ PDF ticket download
- ✅ Email confirmations
- ✅ Accessibility (WCAG AA compliant)

### Backend
- ✅ JWT authentication with refresh tokens
- ✅ Guest login with session limits (20 max)
- ✅ Rate limiting on auth endpoints
- ✅ Password hashing with bcrypt
- ✅ Email notifications
- ✅ Mock payment gateway
- ✅ Comprehensive error handling
- ✅ CORS configuration
- ✅ Input validation

## 🔐 Security

- Passwords hashed with bcrypt
- JWT tokens with expiration
- Rate limiting (5 attempts per 10 min on login)
- CORS enabled for localhost only
- No sensitive data in error messages
- Token refresh mechanism
- Session timeout enforcement

## 📊 Database

**Tables:**
- users
- cities
- airlines
- flights
- bookings
- passengers
- booking_addons
- payments
- guest_login_attempts

**Sample Data:**
- 20 cities (major airports worldwide)
- 10 airlines
- 10 sample flights

## 🐛 Debugging

### Backend Logs
```bash
# Enable debug mode
DEBUG=flight-booking:* npm run dev
```

### Frontend DevTools
```bash
# React DevTools Chrome extension
# Redux DevTools (for Zustand debugging)
```

### Database Queries
```bash
# Connect to PostgreSQL
psql -h localhost -U flightuser -d flight_booking

# View migrations
select * from knex_migrations;
```

## 📝 Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=flightuser
DB_PASSWORD=flightpass123
DB_NAME=flight_booking
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRY=3600
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
VITE_SESSION_TIMEOUT=3600
```

## 🚀 Deployment

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📞 Support & Issues

For issues or questions:
1. Check logs for error messages
2. Verify environment variables
3. Ensure database is running
4. Clear browser cache & localStorage
5. Check network tab for API errors

## 📄 License

MIT

## 🤝 Contributing

Pull requests welcome! Please follow the code style and add tests.

---

**Built with ❤️ for comprehensive QA testing**
**FlightQA-Agent Specification v2.0 Compliant**
