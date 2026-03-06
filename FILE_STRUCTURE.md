# Complete File Structure & Reference

## Project Root Structure

```
QualititudeAI-Demo/
├── backend/                      # Node.js/Express API server
├── frontend/                     # React application
├── docker-compose.yml            # PostgreSQL + Redis setup
├── README.md                     # Quick start guide
├── PROJECT_STATUS.md             # Detailed project status
├── WORK_COMPLETION_SUMMARY.md    # What's done, what's pending
├── AUTOMATION_IDS_GUIDE.md       # Test automation reference
├── QA_TEST_CASES.md              # 100+ comprehensive test cases
└── FILE_STRUCTURE.md             # This file
```

## Backend Directory Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js        ✅ Authentication logic
│   │   ├── flightController.js      ✅ Flight search logic
│   │   ├── bookingController.js     ✅ Booking management
│   │   └── paymentController.js     ✅ Payment processing
│   │
│   ├── models/
│   │   ├── User.js                 ✅ User data access
│   │   ├── Flight.js               ✅ Flight data access
│   │   ├── Booking.js              ✅ Booking + Passenger + Payment classes
│   │   └── GuestAttempt.js         ✅ Guest session tracking
│   │
│   ├── routes/
│   │   ├── auth.js                 ✅ /api/auth/* routes
│   │   ├── flights.js              ✅ /api/flights/* routes
│   │   ├── booking.js              ✅ /api/booking/* routes
│   │   └── payment.js              ✅ /api/payment/* routes
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js       ✅ JWT verification
│   │   ├── errorHandler.js         ✅ Global error handling
│   │   └── rateLimiter.js          ✅ Rate limiting
│   │
│   ├── services/
│   │   └── emailService.js         ✅ Email notifications
│   │
│   ├── utils/
│   │   ├── validators.js           ✅ Input validation schemas
│   │   └── responseFormat.js       ✅ HTTP response formatting
│   │
│   ├── db/
│   │   ├── connection.js           ✅ Database connection
│   │   ├── migrations/
│   │   │   ├── 001_create_users.js
│   │   │   ├── 002_create_guest_attempts.js
│   │   │   ├── 003_create_cities_airlines.js
│   │   │   ├── 004_create_flights.js
│   │   │   ├── 005_create_bookings.js
│   │   │   ├── 006_create_passengers_addons.js
│   │   │   └── 007_create_payments.js
│   │   └── seeds/
│   │       ├── 01_seed_cities.js
│   │       ├── 02_seed_airlines.js
│   │       └── 03_seed_flights.js
│   │
│   └── app.js                      ✅ Express app entry point
│
├── knexfile.js                     ✅ Database configuration
├── package.json                    ✅ Dependencies + scripts
├── .env.example                    ✅ Environment template
├── .gitignore                      ✅ Git ignore rules
└── node_modules/                  ℹ️  Not tracked (npm install)
```

## Frontend Directory Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx           ✅ Login with guest access (IMPLEMENTED)
│   │   ├── RegisterPage.jsx        ⏳ Registration form (STUB)
│   │   ├── SearchPage.jsx          ⏳ Flight search form (STUB)
│   │   ├── ResultsPage.jsx         ⏳ Flight results list (STUB)
│   │   ├── PassengersPage.jsx      ⏳ Passenger details (STUB)
│   │   ├── AddOnsPage.jsx          ⏳ Add-ons selection (STUB)
│   │   ├── SummaryPage.jsx         ⏳ Booking review (STUB)
│   │   ├── PaymentPage.jsx         ⏳ Payment form (STUB)
│   │   └── ConfirmationPage.jsx    ⏳ Booking confirmation (STUB)
│   │
│   ├── components/
│   │   ├── Header.jsx              ✅ Header with session timer
│   │   ├── ProtectedRoute.jsx      ✅ Route guard component
│   │   └── [More components needed]
│   │
│   ├── store/
│   │   ├── authStore.js            ✅ Auth state management (Zustand)
│   │   └── bookingStore.js         ✅ Booking state management (Zustand)
│   │
│   ├── api/
│   │   ├── client.js               ✅ Axios client with interceptors
│   │   └── services.js             ✅ API endpoint wrappers
│   │
│   ├── App.jsx                     ✅ Main app routing
│   ├── main.jsx                    ✅ React entry point
│   └── index.css                   ✅ Global styles + Tailwind
│
├── public/
│   └── [Static assets - empty initially]
│
├── vite.config.js                  ✅ Vite configuration
├── tailwind.config.js              ✅ Tailwind CSS configuration
├── postcss.config.js               ✅ PostCSS configuration
├── package.json                    ✅ Dependencies + scripts
├── .env.example                    ✅ Environment template
├── .gitignore                      ✅ Git ignore rules
├── index.html                      ✅ HTML entry point
└── node_modules/                   ℹ️  Not tracked (npm install)
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mobile VARCHAR(15),
    password_hash TEXT NOT NULL,
    is_guest BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Cities Table
```sql
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    iata_code VARCHAR(3) UNIQUE NOT NULL,
    country VARCHAR(100),
    timezone VARCHAR(50)
);
-- Pre-seeded with 20 major cities
```

### Airlines Table
```sql
CREATE TABLE airlines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    iata_code VARCHAR(2) UNIQUE NOT NULL,
    logo_url TEXT
);
-- Pre-seeded with 10 airlines
```

### Flights Table
```sql
CREATE TABLE flights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    airline_id INT REFERENCES airlines(id),
    flight_number VARCHAR(10) NOT NULL,
    origin_id INT REFERENCES cities(id),
    destination_id INT REFERENCES cities(id),
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    duration_mins INT NOT NULL,
    base_price_adult DECIMAL(10,2),
    base_price_child DECIMAL(10,2),
    base_price_newborn DECIMAL(10,2),
    available_days VARCHAR(20),
    total_seats INT DEFAULT 180,
    available_seats INT DEFAULT 180
);
-- Pre-seeded with 10 sample flights
```

### Other Tables
- `bookings` - Booking records
- `passengers` - Passenger details
- `booking_addons` - Selected extras
- `payments` - Payment records
- `guest_login_attempts` - Guest session tracking

## API Endpoints Reference

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/auth/guest-check`

### Flights
- `GET /api/flights/cities`
- `GET /api/flights/airlines`
- `POST /api/flights/search`
- `GET /api/flights/:id`

### Bookings
- `POST /api/booking`
- `GET /api/booking/:bookingId`
- `POST /api/booking/:bookingId/passengers`
- `POST /api/booking/:bookingId/addons`
- `GET /api/booking/:bookingId/summary`
- `POST /api/booking/:bookingId/confirm`
- `GET /api/booking/ticket/:bookingRef`

### Payments
- `POST /api/payment/initiate`
- `POST /api/payment/callback`
- `GET /api/payment/dummy-bank`
- `GET /api/payment/:bookingId/status`

## Important Files for Different Roles

### For Backend Developers
1. `backend/src/app.js` - Entry point
2. `backend/src/controllers/*` - Business logic
3. `backend/src/models/*` - Data access
4. `backend/src/routes/*` - API definitions
5. `backend/knexfile.js` - Database config
6. `backend/src/db/migrations/*` - Schema changes

### For Frontend Developers
1. `frontend/src/App.jsx` - Routing setup
2. `frontend/src/pages/*` - Work on these next
3. `frontend/src/store/*` - State management
4. `frontend/src/api/services.js` - API calls
5. `frontend/vite.config.js` - Build config
6. `frontend/tailwind.config.js` - Styling config

### For QA/Testing
1. `QA_TEST_CASES.md` - Test cases to execute
2. `AUTOMATION_IDS_GUIDE.md` - Element selectors
3. `frontend/src/pages/LoginPage.jsx` - Reference implementation
4. `WORK_COMPLETION_SUMMARY.md` - Testing checklist

### For DevOps/Infrastructure
1. `docker-compose.yml` - Local development setup
2. `backend/.env.example` - Server config
3. `frontend/.env.example` - Client config
4. `backend/knexfile.js` - Database migrations
5. `backend/package.json` - Dependencies

## Configuration Files

### Backend Configuration
- `.env.example` - Environment variables template
- `knexfile.js` - Database connection & migrations
- `docker-compose.yml` - Container setup (PostgreSQL, Redis)
- `package.json` - Dependencies & scripts

### Frontend Configuration
- `.env.example` - Environment variables
- `vite.config.js` - Build & dev server
- `tailwind.config.js` - CSS framework
- `postcss.config.js` - CSS processing
- `package.json` - Dependencies & scripts

## Key Implementation Files by Feature

### Authentication
```
Backend:
  - src/controllers/authController.js
  - src/models/User.js
  - src/routes/auth.js
  - src/middleware/authMiddleware.js

Frontend:
  - src/pages/LoginPage.jsx
  - src/pages/RegisterPage.jsx
  - src/store/authStore.js
  - src/api/services.js -> authAPI
```

### Flight Search
```
Backend:
  - src/controllers/flightController.js
  - src/models/Flight.js
  - src/routes/flights.js

Frontend:
  - src/pages/SearchPage.jsx
  - src/pages/ResultsPage.jsx
  - src/store/bookingStore.js
  - src/api/services.js -> flightAPI
```

### Booking Management
```
Backend:
  - src/controllers/bookingController.js
  - src/models/Booking.js (Booking, Passenger, BookingAddOn)
  - src/routes/booking.js

Frontend:
  - src/pages/PassengersPage.jsx
  - src/pages/AddOnsPage.jsx
  - src/pages/SummaryPage.jsx
  - src/store/bookingStore.js
  - src/api/services.js -> bookingAPI
```

### Payment Processing
```
Backend:
  - src/controllers/paymentController.js
  - src/models/Booking.js (Payment class)
  - src/routes/payment.js

Frontend:
  - src/pages/PaymentPage.jsx
  - src/pages/ConfirmationPage.jsx
  - src/api/services.js -> paymentAPI
```

### Email Notifications
```
Backend:
  - src/services/emailService.js
  - Integrated in bookingController
  - Integrated in paymentController
```

## Next Steps by Priority

### Priority 1: Backend Complete ✅
- ✅ All API endpoints working
- ✅ All routes configured
- ✅ Database ready
- ✅ Email service ready

### Priority 2: Frontend Pages (THIS WEEK)
- ⏳ Register page implementation
- ⏳ Search page implementation
- ⏳ Results page implementation
- ⏳ Passenger page implementation
- ⏳ Add-ons page implementation
- ⏳ Summary page implementation
- ⏳ Payment page implementation
- ⏳ Confirmation page implementation

### Priority 3: Frontend Features (NEXT WEEK)
- ❌ Form validation
- ❌ Error/success messages
- ❌ Loading states
- ❌ Session timer
- ❌ PDF generation
- ❌ Confetti animation

### Priority 4: Testing (WEEK 3)
- ❌ Manual QA testing
- ❌ Unit tests
- ❌ E2E tests
- ❌ Accessibility audit

---

**Total Backend Files**: 25+
**Total Frontend Files**: 20+
**Total Documentation Files**: 6
**Total Configuration Files**: 8

**Status**: 70% Complete
**Next Milestone**: Frontend pages complete (target: end of this week)
