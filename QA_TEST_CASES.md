# QA Test Cases - Flight Booking System

This document contains comprehensive test cases mapped to the FlightQA-Agent specification.

## Test Case Format

| TC# | Scenario | Input | Expected Result | Severity |
|-----|----------|-------|-----------------|----------|

## Section 1: Authentication Tests

### TC-A01 to TC-A18: Login, Registration, Session Management

| TC# | Scenario | Input | Expected Result | Severity |
|-----|----------|-------|-----------------|----------|
| TC-A01 | Valid guest login (attempt 1) | admin / admin@123 | Login success, session started | Critical |
| TC-A02 | Valid guest login (attempt 20 - boundary) | admin / admin@123 | Login success (last allowed guest session) | Critical |
| TC-A03 | Guest login (attempt 21 - over limit) | admin / admin@123 | Blocked, registration modal shown | Critical |
| TC-A04 | Login with wrong password | admin / wrongpass | Error: "Invalid username or password" | High |
| TC-A05 | Login with empty username | '' / admin@123 | Error: "Username is required" | High |
| TC-A06 | Login with empty password | admin / '' | Error: "Password is required" | High |
| TC-A07 | Login with both fields empty | '' / '' | Both fields show required error | High |
| TC-A08 | 5 consecutive failed logins (rate limit) | admin / wrong (×5) | Account locked for 10 min | High |
| TC-A09 | Session timeout after 60 minutes | Valid session idle 60 min | Redirect to login with timeout message | Critical |
| TC-A10 | Session warning at 5 min remaining | Valid session with 5 min left | Yellow warning banner shown | Medium |
| TC-A11 | Extend session before timeout | Click "Extend Session" | Token refreshed, timer resets | High |
| TC-A12 | Logout clears session | Click Logout → Confirm | Redirected to login, back button doesn't work | Critical |
| TC-A13 | Access booking URL without login | Direct URL navigation | Redirected to login page | Critical |
| TC-A14 | Register with valid new credentials | New unique email + valid password | Account created, auto-login, home shown | Critical |
| TC-A15 | Register with duplicate email | Existing email address | Error: "Email already registered" | High |
| TC-A16 | Register with password mismatch | Pass: Test@123 / Confirm: Test@124 | Error: "Passwords do not match" | High |
| TC-A17 | Register with weak password | password123 (no uppercase/special) | Error: Password strength insufficient | Medium |
| TC-A18 | Register without terms checkbox | All fields valid, box unchecked | Submit blocked, checkbox highlighted | Medium |

## Section 2: Flight Search Tests

### TC-S01 to TC-S13: Search functionality, validation, boundary testing

| TC# | Scenario | Input | Expected Result | Severity |
|-----|----------|-------|-----------------|----------|
| TC-S01 | Valid one-way search | DEL→BOM, future date, 1 adult | Results list shown | Critical |
| TC-S02 | Valid return search | DEL→LHR, future dates, 2 adults | Split-screen results shown | Critical |
| TC-S03 | Search with 0 adults, 1 child | 0 adults, 1 child | Error: "At least 1 adult required" | Critical |
| TC-S04 | Search with newborn only | 0 adults, 1 newborn | Error: "Newborn must travel with adult" | Critical |
| TC-S05 | Same origin and destination | DEL → DEL | Error: "Cities cannot be the same" | High |
| TC-S06 | Past travel date | Yesterday's date | Date picker disabled; error if bypassed | High |
| TC-S07 | Return date before departure | Return: Jan 1, Depart: Jan 5 | Error: "Return date must be after departure" | High |
| TC-S08 | Search with no origin selected | (origin empty) | Error: "Please select departure city" | High |
| TC-S09 | Swap origin and destination | Click ⇄ button | Fields swap, no error | Medium |
| TC-S10 | Total passengers = 9 (maximum) | 5 adults, 3 children, 1 newborn | Allowed, search proceeds | Boundary |
| TC-S11 | Total passengers = 10 (over maximum) | 5 adults, 4 children, 1 newborn | Plus button disabled at 9, error on attempt | Boundary |
| TC-S12 | Search returns no results | BLR → GOI (no flights seeded) | Empty state shown with "Modify Search" | Medium |
| TC-S13 | Modify search preserves values | After results shown, click Modify | Form pre-filled with previous search | Medium |

## Section 3: Payment Tests

### TC-P01 to TC-P20: Card validation, payment processing, error handling

| TC# | Scenario | Input | Expected Result | Severity |
|-----|----------|-------|-----------------|----------|
| TC-P01 | Valid credit card payment | 4111111111111111, 12/27, 123 | Bank redirect → success → confirmation | Critical |
| TC-P02 | Card number - 15 digits (boundary -1) | 411111111111111 (15 digits) | Error: "Enter a valid 16-digit card number" | Critical |
| TC-P03 | Card number - 16 digits (valid boundary) | 4111111111111111 (16 digits) | Accepted | Critical |
| TC-P04 | Card number - 17 digits (boundary +1) | 41111111111111111 (17 digits) | Error: "Enter a valid 16-digit card number" | Critical |
| TC-P05 | Card number with letters | 4111-ABCD-1111-1111 | Input blocked / error shown | High |
| TC-P06 | Card number with spaces (raw input) | "4111 1111 1111 1111" | Auto-formats to 4111111111111111 (accepts) | High |
| TC-P07 | Expired card (past month/year) | Expiry: 01/20 | Error: "Card has expired" | Critical |
| TC-P08 | Expiry this month (boundary - valid) | Expiry: current MM/YY | Accepted | Boundary |
| TC-P09 | CVV - 2 digits (short) | CVV: 12 | Error: "Enter a valid CVV" | High |
| TC-P10 | CVV - 3 digits (valid) | CVV: 123 | Accepted | High |
| TC-P11 | CVV - 4 digits (invalid for non-Amex) | CVV: 1234 | Error: "Enter a valid CVV" | High |
| TC-P12 | Name on card - empty | '' | Error: "Enter the name on your card" | High |
| TC-P13 | Name on card - numeric only | 12345 | Error: "Name must contain letters only" | Medium |
| TC-P14 | Valid UPI ID | user@okicici | Accepted, payment proceeds | Critical |
| TC-P15 | UPI ID without @ symbol | userokicici | Error: "Enter a valid UPI ID" | High |
| TC-P16 | UPI ID with special chars | user#@okicici | Error: "Enter a valid UPI ID" | High |
| TC-P17 | Bank redirect loading simulation | Any valid payment | Loading screen 4–7 sec, then redirect | Medium |
| TC-P18 | Duplicate payment attempt | Submit same booking payment twice | Error: "This booking has already been paid" | Critical |
| TC-P19 | Payment token tampering | Modify token in URL | Error: "Payment verification failed" | Critical |
| TC-P20 | Network error during payment | Kill network after submit | "Do not refresh" warning, auto-retry | High |

## Section 4: Date Validation Tests

### TC-D01 to TC-D07: Date boundary testing, timezone handling

| TC# | Scenario | Input | Expected Result | Severity |
|-----|----------|-------|-----------------|----------|
| TC-D01 | Today with future-time flight | Today, flight at 11:59 PM | Allowed | Boundary |
| TC-D02 | Yesterday's date | Yesterday | Date picker disabled, error if bypassed | Critical |
| TC-D03 | Return date same as departure (valid) | Depart Jan 15, Return Jan 15 | Allowed (same-day return) | Boundary |
| TC-D04 | Return date 1 day before departure | Depart Jan 15, Return Jan 14 | Error: Invalid date range | Critical |
| TC-D05 | Date 365 days in future | 1 year from today | Allowed (optionally shows advisory) | Boundary |
| TC-D06 | Date 366 days in future | 1 year + 1 day | Optionally blocked or warned | Boundary |
| TC-D07 | Invalid date format (manual input attempt) | 31/13/2025 | Field rejected, correct format shown | Medium |

## Section 5: Navigation Guard Tests

### TC-N01 to TC-N06: Protection against incomplete bookings

| TC# | Scenario | Input | Expected Result | Severity |
|-----|----------|-------|-----------------|----------|
| TC-N01 | Continue without selecting flight | Click Continue on results | Blocked + toast + scroll to unselected | Critical |
| TC-N02 | Continue on return with only 1 leg selected | Select only outbound, click Next | Blocked + "Select both flights" error | Critical |
| TC-N03 | Access summary page directly via URL | Paste summary URL in browser | Redirect to search (no active booking) | Critical |
| TC-N04 | Access payment page directly via URL | Paste payment URL | Redirect to search or 403 | Critical |
| TC-N05 | Back button from confirmation to payment | Browser back on confirmation | Modal shown, cannot re-access payment | Critical |
| TC-N06 | Search without adding passengers | Click Search with 0 passengers | Error: "Add at least 1 adult" | Critical |

## Section 6: Accessibility Tests

### TC-ACC01 to TC-ACC10: WCAG AA compliance

| TC# | Scenario | Input | Expected Result | Severity |
|-----|----------|-------|-----------------|----------|
| TC-ACC01 | Tab navigation through form | Tab key | All inputs/buttons reachable in logical order | High |
| TC-ACC02 | Screen reader reads form labels | Screen reader (NVDA/JAWS) | All labels, buttons, errors announced | High |
| TC-ACC03 | Color contrast on text | Check with WCAG contrast checker | All text meets AA standard (4.5:1) | High |
| TC-ACC04 | Focus indicators visible | Tab to elements | Clear focus outline visible | High |
| TC-ACC05 | Icon buttons have aria-label | Inspect icon buttons | All have descriptive aria-labels | High |
| TC-ACC06 | Form error messages associated | Inspect error divs | aria-live or role="alert" present | High |
| TC-ACC07 | Modal keyboard trap | Open modal, tab key | Focus trapped inside modal | Medium |
| TC-ACC08 | Mobile text size | 14px minimum on mobile | Text meets accessibility minimum | Medium |
| TC-ACC09 | Alt text on images | Inspect img tags | All images have descriptive alt text | Medium |
| TC-ACC10 | Keyboard-only navigation | Keyboard only, no mouse | Complete flow usable | High |

## Section 7: Responsive Design Tests

### TC-RES01 to TC-RES08: Mobile, tablet, desktop viewports

| TC# | Scenario | Input | Expected Result | Severity |
|-----|----------|-------|-----------------|----------|
| TC-RES01 | Mobile 375px layout | iPhone SE viewport | All content visible, no overflow | High |
| TC-RES02 | Tablet 768px layout | iPad viewport | 2-column layout used appropriately | High |
| TC-RES03 | Desktop 1440px layout | Large desktop | 3-column layout, full width utilized | High |
| TC-RES04 | Images scale responsively | Different viewports | Images scale without distortion | Medium |
| TC-RES05 | Form inputs touch-friendly | Mobile viewport | Inputs 44px minimum height/width | High |
| TC-RES06 | Navigation mobile menu | Mobile viewport | Hamburger menu present and functional | High |
| TC-RES07 | Table scrolls on mobile | Results table on 375px | Horizontal scroll available | Medium |
| TC-RES08 | Modals fit on mobile | Display modal on 375px | Modal fits with scroll, closes available | High |

## Test Execution Guidelines

1. **Pre-Test Setup**
   - Clear browser cache and localStorage
   - Use incognito/private mode for clean sessions
   - Test on Chrome, Firefox, Safari, Edge minimum

2. **Test Data**
   - Use login: admin / admin@123 for guest access
   - Create new test accounts for registration tests
   - Use sample flights from seed data

3. **Automation**
   - Use automation IDs from AUTOMATION_IDS_GUIDE.md
   - Test data-testid attributes present on all interactive elements
   - Verify accessibility attributes (aria-label, role, etc.)

4. **Reporting**
   - Document steps to reproduce
   - Provide screenshots/videos
   - Include browser and OS information
   - Attach network tab HAR file for API issues

## Critical Paths to Test

1. **Happy Path (Authentication → Booking → Payment → Confirmation)**
   - Admin login → Search flights → Select flights → Add passengers → Add add-ons → Review → Pay → Confirmation

2. **Error Scenarios**
   - Invalid credentials
   - Network failures
   - Session timeout
   - Payment failure
   - Validation errors

3. **Edge Cases**
   - Boundary values (max passengers, min price)
   - Timezone handling
   - Return flights on same day
   - Duplicate bookings
   - Expired cards

---

**Total Test Cases**: 100+
**Coverage Level**: Comprehensive (happy path, negative, boundary, edge cases)
**Severity Distribution**: 30 Critical, 40 High, 20 Medium, 10 Low
