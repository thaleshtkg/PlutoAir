# Automation IDs Reference Guide

## Overview
All interactive elements must include unique, semantic identifiers for test automation. This document defines the naming convention and examples for every page/component.

---

## Naming Convention

### Format: `data-testid="[page]-[component]-[action/type]"`

**Examples:**
- `data-testid="login-username-input"`
- `data-testid="search-button-submit"`
- `data-testid="results-flight-card"`
- `data-testid="payment-card-number-input"`

### Additional Attributes
- **id**: Unique element identifier (for direct DOM selection)
- **name**: Form field name (for accessibility)
- **aria-label**: Screen reader text (for accessibility)

---

## Authentication Pages

### Login Page

```html
<!-- Form Container -->
<form data-testid="login-form" id="login-form">
  <!-- Username Field -->
  <input
    data-testid="login-username-input"
    id="username"
    name="username"
    aria-label="Username or Email"
    placeholder="Username or Email"
  />

  <!-- Password Field -->
  <input
    data-testid="login-password-input"
    id="password"
    name="password"
    type="password"
    aria-label="Password"
    placeholder="Password"
  />

  <!-- Show/Hide Toggle -->
  <button
    data-testid="login-password-toggle"
    type="button"
    aria-label="Toggle password visibility"
  >
    👁️
  </button>

  <!-- Remember Me -->
  <input
    data-testid="login-remember-checkbox"
    id="remember"
    name="remember"
    type="checkbox"
    aria-label="Remember me"
  />

  <!-- Sign In Button -->
  <button
    data-testid="login-button-signin"
    type="submit"
    id="signin-btn"
  >
    Sign In
  </button>
</form>

<!-- Guest Access Banner -->
<div
  data-testid="login-guest-banner"
  id="guest-banner"
>
  <button
    data-testid="login-guest-banner-close"
    aria-label="Close guest info banner"
  >
    ✕
  </button>

  <button
    data-testid="login-guest-credentials-button"
    id="use-guest-btn"
  >
    Use These Credentials
  </button>
</div>

<!-- Registration Link -->
<a
  data-testid="login-link-register"
  href="/register"
>
  Register here
</a>

<!-- Guest Session Counter -->
<div data-testid="login-guest-counter" id="session-counter">
  Guest sessions remaining: <span data-testid="login-guest-count-value">20</span> / 20
</div>
```

### Registration Page

```html
<form data-testid="register-form" id="register-form">
  <!-- Full Name -->
  <input
    data-testid="register-fullname-input"
    id="fullname"
    name="fullname"
    aria-label="Full Name"
  />
  <span data-testid="register-fullname-error" class="error"></span>

  <!-- Email -->
  <input
    data-testid="register-email-input"
    id="email"
    name="email"
    type="email"
    aria-label="Email Address"
  />
  <span data-testid="register-email-error" class="error"></span>

  <!-- Mobile -->
  <input
    data-testid="register-mobile-input"
    id="mobile"
    name="mobile"
    type="tel"
    aria-label="Mobile Number"
  />

  <!-- Password -->
  <input
    data-testid="register-password-input"
    id="password"
    name="password"
    type="password"
    aria-label="Password"
  />
  <div data-testid="register-password-strength" id="strength-meter">
    Strength: <span data-testid="register-password-strength-text">Weak</span>
  </div>

  <!-- Confirm Password -->
  <input
    data-testid="register-password-confirm-input"
    id="confirm_password"
    name="confirm_password"
    type="password"
    aria-label="Confirm Password"
  />

  <!-- Terms Checkbox -->
  <input
    data-testid="register-terms-checkbox"
    id="terms"
    name="terms"
    type="checkbox"
    aria-label="Accept terms and conditions"
  />

  <!-- Submit Button -->
  <button
    data-testid="register-button-submit"
    type="submit"
    id="register-btn"
  >
    Create Account
  </button>
</form>
```

---

## Flight Search Page

```html
<!-- Trip Type Toggle -->
<div data-testid="search-triptype-toggle" id="triptype-toggle">
  <button
    data-testid="search-triptype-oneway"
    class="toggle-btn"
  >
    ✈ One Way
  </button>
  <button
    data-testid="search-triptype-return"
    class="toggle-btn"
  >
    ⇄ Return
  </button>
</div>

<!-- Origin City -->
<div data-testid="search-origin-field">
  <input
    data-testid="search-origin-input"
    id="origin"
    name="origin"
    placeholder="Departure City"
    aria-label="Departure City"
  />
  <ul data-testid="search-origin-dropdown" role="listbox">
    <li data-testid="search-origin-option-1" role="option">New Delhi (DEL)</li>
    <li data-testid="search-origin-option-2" role="option">Mumbai (BOM)</li>
  </ul>
</div>

<!-- Swap Button -->
<button
  data-testid="search-button-swap"
  aria-label="Swap origin and destination"
  type="button"
>
  ⇄
</button>

<!-- Destination City -->
<div data-testid="search-destination-field">
  <input
    data-testid="search-destination-input"
    id="destination"
    name="destination"
    placeholder="Arrival City"
    aria-label="Arrival City"
  />
</div>

<!-- Travel Date -->
<div data-testid="search-traveldate-field">
  <input
    data-testid="search-traveldate-input"
    id="travel_date"
    name="travel_date"
    type="date"
    aria-label="Travel Date"
  />
</div>

<!-- Return Date (conditional) -->
<div data-testid="search-returndate-field" id="returndate-field">
  <input
    data-testid="search-returndate-input"
    id="return_date"
    name="return_date"
    type="date"
    aria-label="Return Date"
  />
</div>

<!-- Passenger Accordion -->
<div data-testid="search-passenger-accordion" id="passenger-accordion">
  <button
    data-testid="search-passenger-toggle"
    aria-expanded="false"
    aria-controls="passenger-details"
  >
    <span data-testid="search-passenger-summary">1 Adult</span>
    ▼
  </button>

  <div
    data-testid="search-passenger-details"
    id="passenger-details"
    hidden
  >
    <!-- Adults -->
    <div data-testid="search-passenger-adults">
      <button
        data-testid="search-passenger-adults-minus"
        aria-label="Decrease adult count"
        type="button"
      >
        −
      </button>
      <span data-testid="search-passenger-adults-count">1</span>
      <button
        data-testid="search-passenger-adults-plus"
        aria-label="Increase adult count"
        type="button"
      >
        +
      </button>
    </div>

    <!-- Children -->
    <div data-testid="search-passenger-children">
      <button
        data-testid="search-passenger-children-minus"
        aria-label="Decrease children count"
        type="button"
      >
        −
      </button>
      <span data-testid="search-passenger-children-count">0</span>
      <button
        data-testid="search-passenger-children-plus"
        aria-label="Increase children count"
        type="button"
      >
        +
      </button>
    </div>

    <!-- Newborns -->
    <div data-testid="search-passenger-newborns">
      <button
        data-testid="search-passenger-newborns-minus"
        aria-label="Decrease newborn count"
        type="button"
      >
        −
      </button>
      <span data-testid="search-passenger-newborns-count">0</span>
      <button
        data-testid="search-passenger-newborns-plus"
        aria-label="Increase newborn count"
        type="button"
      >
        +
      </button>
    </div>

    <div data-testid="search-passenger-total">
      Total: <span data-testid="search-passenger-total-count">1</span>
    </div>
  </div>
</div>

<!-- Search Button -->
<button
  data-testid="search-button-submit"
  type="submit"
  id="search-btn"
>
  Search Flights
</button>

<!-- Error Messages -->
<div data-testid="search-error-container" class="error-messages"></div>
```

---

## Flight Results Page

### Filter/Sort Sidebar

```html
<!-- Sort Options -->
<div data-testid="results-sort-container">
  <label for="sort-select">Sort By:</label>
  <select
    data-testid="results-sort-select"
    id="sort-select"
    name="sort"
  >
    <option data-testid="results-sort-price" value="price">Price</option>
    <option data-testid="results-sort-duration" value="duration">Duration</option>
    <option data-testid="results-sort-departure" value="departure">Departure</option>
    <option data-testid="results-sort-arrival" value="arrival">Arrival</option>
  </select>
</div>

<!-- Filters -->
<div data-testid="results-filter-container">
  <!-- Airline Filter -->
  <div data-testid="results-filter-airline">
    <h3>Airlines</h3>
    <input
      data-testid="results-filter-airline-6e"
      type="checkbox"
      id="airline-6e"
      value="6E"
    />
    <label for="airline-6e">IndiGo</label>
  </div>

  <!-- Time Filter -->
  <div data-testid="results-filter-time">
    <h3>Departure Time</h3>
    <input
      data-testid="results-filter-time-morning"
      type="checkbox"
      value="morning"
    />
    <label>Morning (6am-12pm)</label>
  </div>

  <!-- Price Range -->
  <div data-testid="results-filter-price">
    <h3>Price Range</h3>
    <input
      data-testid="results-filter-price-min"
      type="number"
      placeholder="Min"
    />
    <input
      data-testid="results-filter-price-max"
      type="number"
      placeholder="Max"
    />
  </div>

  <!-- Clear Filters -->
  <button
    data-testid="results-button-clear-filters"
    type="button"
  >
    Clear All Filters
  </button>
</div>
```

### Flight Cards

```html
<div data-testid="results-flightcard" id="flight-card-1">
  <div data-testid="results-flight-airline">
    <img src="" alt="" />
    <span data-testid="results-flight-airline-name">IndiGo</span>
    <span data-testid="results-flight-number">6E-201</span>
  </div>

  <div data-testid="results-flight-times">
    <span data-testid="results-flight-departure-time">06:00</span>
    <span data-testid="results-flight-duration">2h 05m</span>
    <span data-testid="results-flight-arrival-time">08:05</span>
  </div>

  <div data-testid="results-flight-route">
    <span data-testid="results-flight-origin">DEL</span>
    <span data-testid="results-flight-stops">Direct</span>
    <span data-testid="results-flight-destination">BOM</span>
  </div>

  <div data-testid="results-flight-price">
    <span data-testid="results-flight-price-value">₹3,499</span>
    <span data-testid="results-flight-price-label">per person</span>
  </div>

  <!-- Best Price Badge -->
  <span data-testid="results-flight-badge-bestprice">
    Best Price
  </span>

  <!-- Select Button -->
  <button
    data-testid="results-flight-button-select"
    id="select-flight-1"
  >
    Select
  </button>
</div>
```

---

## Payment Page

```html
<!-- Payment Method Selector -->
<div data-testid="payment-method-selector">
  <button
    data-testid="payment-method-card"
    class="method-btn"
  >
    💳 Card
  </button>
  <button
    data-testid="payment-method-upi"
    class="method-btn"
  >
    📱 UPI
  </button>
  <button
    data-testid="payment-method-paypal"
    class="method-btn"
  >
    🅿️ PayPal
  </button>
</div>

<!-- Card Payment Form -->
<form data-testid="payment-card-form" id="card-payment">
  <input
    data-testid="payment-card-number"
    id="card_number"
    name="card_number"
    placeholder="4111 1111 1111 1111"
    aria-label="Card Number"
  />

  <input
    data-testid="payment-card-expiry"
    id="card_expiry"
    name="card_expiry"
    placeholder="MM/YY"
    aria-label="Expiry Date"
  />

  <input
    data-testid="payment-card-cvv"
    id="card_cvv"
    name="card_cvv"
    placeholder="CVV"
    type="password"
    aria-label="CVV"
  />

  <input
    data-testid="payment-card-name"
    id="card_name"
    name="card_name"
    placeholder="Name on Card"
    aria-label="Name on Card"
  />
</form>

<!-- UPI Payment Form -->
<form data-testid="payment-upi-form" id="upi-payment" hidden>
  <input
    data-testid="payment-upi-id"
    id="upi_id"
    name="upi_id"
    placeholder="user@bank"
    aria-label="UPI ID"
  />
</form>

<!-- Pay Button -->
<button
  data-testid="payment-button-pay"
  type="submit"
  id="pay-btn"
>
  Pay ₹X,XXX
</button>

<!-- Security Badge -->
<div data-testid="payment-security-badge">
  🔒 Secure Payment — SSL Encrypted
</div>
```

---

## Confirmation Page

```html
<!-- Success Banner -->
<div data-testid="confirmation-success-banner" class="success">
  <h1 data-testid="confirmation-title">✅ Booking Confirmed!</h1>
</div>

<!-- Booking Reference -->
<div data-testid="confirmation-booking-ref">
  <span data-testid="confirmation-booking-ref-label">Booking Reference:</span>
  <span data-testid="confirmation-booking-ref-value">FLT-A7B3C2D1</span>
</div>

<!-- Ticker Details -->
<div data-testid="confirmation-ticket">
  <div data-testid="confirmation-passengers">
    <h2>Passengers</h2>
    <div data-testid="confirmation-passenger-1">John Doe</div>
  </div>

  <div data-testid="confirmation-flight">
    <h2>Flight Details</h2>
    <span data-testid="confirmation-flight-number">6E-201</span>
    <span data-testid="confirmation-flight-route">DEL → BOM</span>
    <span data-testid="confirmation-flight-datetime">
      15 Jan, 06:00 → 08:05
    </span>
  </div>

  <div data-testid="confirmation-amount">
    <h2>Total Amount Paid</h2>
    <span data-testid="confirmation-amount-value">₹3,499</span>
  </div>
</div>

<!-- Action Buttons -->
<div data-testid="confirmation-actions">
  <button
    data-testid="confirmation-button-download"
    type="button"
  >
    📥 Download Ticket (PDF)
  </button>

  <button
    data-testid="confirmation-button-print"
    type="button"
  >
    🖨 Print Ticket
  </button>

  <button
    data-testid="confirmation-button-resend"
    type="button"
  >
    📧 Resend Confirmation Email
  </button>

  <button
    data-testid="confirmation-button-home"
    type="button"
  >
    🏠 Back to Home
  </button>
</div>
```

---

## Form Error Messages

```html
<!-- Error Container Pattern -->
<div data-testid="[page]-[field]-error" class="error-message">
  <span data-testid="[page]-[field]-error-icon">✕</span>
  <span data-testid="[page]-[field]-error-text">Error message here</span>
</div>

<!-- Success Indicator Pattern -->
<div data-testid="[page]-[field]-success" class="success-indicator">
  <span data-testid="[page]-[field]-success-icon">✓</span>
</div>
```

---

## Loading States

```html
<!-- Button Loading State -->
<button
  data-testid="[page]-button-[action]"
  disabled
>
  <span data-testid="[page]-button-[action]-spinner">⏳</span>
  Processing...
</button>

<!-- Skeleton Loader -->
<div data-testid="[page]-skeleton-[item]" class="skeleton-loader">
  <!-- Pulsing gray box -->
</div>

<!-- Modal Loading -->
<div data-testid="[page]-modal-loading" role="status" aria-label="Loading">
  <div data-testid="[page]-modal-loading-spinner"></div>
</div>
```

---

## Accessibility Attributes (All Interactive Elements)

Every interactive element should have:

```html
<button
  data-testid="..."         <!-- For automation -->
  id="..."                  <!-- For direct DOM access -->
  aria-label="..."          <!-- For screen readers -->
  aria-pressed="false"      <!-- For toggle buttons -->
  aria-expanded="false"     <!-- For collapsible content -->
  aria-controls="..."       <!-- Links button to controlled element -->
  title="..."               <!-- Tooltip on hover -->
  type="button|submit"      <!-- Explicit type -->
>
  Label Text
</button>
```

---

## Implementation Checklist

When building each component, ensure:

- ✅ All form inputs have `data-testid`, `id`, `name`, `aria-label`
- ✅ All buttons have `data-testid` and `aria-label`
- ✅ All error messages have `data-testid` with `-error` suffix
- ✅ All success indicators have `data-testid` with `-success` suffix
- ✅ All loading states have `data-testid` with `-spinner` or `-loading` suffix
- ✅ All sections have `data-testid` with the pattern format
- ✅ All lists and tables have `role="list"` / `role="table"`
- ✅ All dropdown options have `role="option"`
- ✅ All modals have `role="dialog"`

---

This guide ensures **100% test automation readiness** for all interactive elements.
