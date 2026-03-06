import { Booking, Payment } from '../models/Booking.js';
import { httpResponses } from '../utils/responseFormat.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import crypto from 'crypto';

// Mock payment tokens storage (in production, use Redis or DB)
const paymentTokens = new Map();

export const paymentController = {
  initiatePayment: asyncHandler(async (req, res) => {
    const { bookingId, payment_method, amount } = req.body;

    if (!bookingId || !payment_method || !amount) {
      return httpResponses.badRequest(res, 'Missing required payment fields');
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return httpResponses.notFound(res, 'Booking not found');
    }

    if (booking.status !== 'PENDING') {
      return httpResponses.conflict(res, 'This booking has already been paid');
    }

    // Verify amount matches booking
    if (Math.abs(amount - booking.total_amount) > 0.01) {
      return httpResponses.badRequest(res, 'Payment amount does not match booking total');
    }

    // Create payment record
    const payment = await Payment.create({
      booking_id: bookingId,
      payment_method,
      amount,
    });

    // Generate unique payment token
    const paymentToken = crypto.randomBytes(32).toString('hex');
    paymentTokens.set(paymentToken, {
      bookingId,
      amount,
      status: 'INITIATED',
      createdAt: Date.now(),
    });

    // Construct redirect URL (mock bank).
    const rawRedirectUrl = process.env.PAYMENT_REDIRECT_URL || 'http://localhost:5000/api/payment/dummy-bank';
    const normalizedRedirectUrl = rawRedirectUrl.includes('/payment/dummy-bank') && !rawRedirectUrl.includes('/api/payment/dummy-bank')
      ? rawRedirectUrl.replace('/payment/dummy-bank', '/api/payment/dummy-bank')
      : rawRedirectUrl;
    const redirectUrl = `${normalizedRedirectUrl}?token=${paymentToken}`;

    return httpResponses.ok(res, {
      payment_id: payment.id,
      payment_token: paymentToken,
      redirect_url: redirectUrl,
    });
  }),

  handleCallback: asyncHandler(async (req, res) => {
    const { token, status } = req.body;

    if (!token || !status) {
      return httpResponses.badRequest(res, 'Missing token or status');
    }

    // Verify token exists and is not expired (10 minutes)
    const tokenData = paymentTokens.get(token);
    if (!tokenData) {
      return httpResponses.forbidden(res, 'Invalid or expired payment token');
    }

    if (Date.now() - tokenData.createdAt > 10 * 60 * 1000) {
      paymentTokens.delete(token);
      return httpResponses.forbidden(res, 'Payment token expired');
    }

    if (status === 'SUCCESS') {
      const booking = await Booking.findById(tokenData.bookingId);
      if (!booking) {
        return httpResponses.notFound(res, 'Booking not found');
      }

      // Update booking status
      await Booking.updateStatus(tokenData.bookingId, 'CONFIRMED');

      // Update payment status
      const payment = await Payment.findByBookingId(tokenData.bookingId);
      if (payment) {
        await Payment.updateStatus(payment.id, 'SUCCESS');
      }

      // Mark token as used
      paymentTokens.delete(token);

      return httpResponses.ok(res, {
        booking_ref: booking.booking_ref,
        status: 'CONFIRMED',
      });
    } else if (status === 'FAILED') {
      const payment = await Payment.findByBookingId(tokenData.bookingId);
      if (payment) {
        await Payment.updateStatus(payment.id, 'FAILED');
      }

      paymentTokens.delete(token);

      return httpResponses.ok(res, {
        status: 'FAILED',
        message: 'Payment was unsuccessful. Please try again.',
      });
    }

    return httpResponses.badRequest(res, 'Invalid payment status');
  }),

  dummyBankPage: asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token || !paymentTokens.has(token)) {
      return res.status(400).send('Invalid payment token');
    }

    // Return HTML of mock bank payment page
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Secure Payment Gateway</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
          }
          .logo {
            font-size: 30px;
            margin-bottom: 20px;
          }
          h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 24px;
          }
          .progress-bar {
            width: 100%;
            height: 6px;
            background: #eee;
            border-radius: 3px;
            margin: 20px 0;
            overflow: hidden;
          }
          .progress {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 3px;
            animation: fill 6s ease-in-out forwards;
          }
          @keyframes fill {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          .status {
            font-size: 14px;
            color: #666;
            margin: 20px 0;
            min-height: 20px;
            font-weight: 500;
          }
          .button-group {
            margin-top: 30px;
          }
          button {
            padding: 12px 24px;
            margin: 10px;
            font-size: 16px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s;
          }
          .success-btn {
            background: #4CAF50;
            color: white;
          }
          .success-btn:hover {
            background: #45a049;
          }
          .fail-btn {
            background: #f44336;
            color: white;
          }
          .fail-btn:hover {
            background: #da190b;
          }
          .auto-redirect {
            margin-top: 20px;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🏦</div>
          <h1>Secure Payment</h1>
          <p>Processing your payment...</p>
          <div class="progress-bar">
            <div class="progress"></div>
          </div>
          <div class="status" id="status">Verifying details...</div>
          <div class="button-group">
            <button class="success-btn" onclick="completePayment('SUCCESS')">✓ Approve Payment</button>
            <button class="fail-btn" onclick="completePayment('FAILED')">✗ Decline Payment</button>
          </div>
          <div class="auto-redirect">Auto-redirecting in 7 seconds...</div>
        </div>

        <script>
          let currentStatus = 0;
          const statuses = [
            'Verifying details...',
            'Contacting bank...',
            'Authorizing transaction...',
            'Processing payment...',
            'Almost done...',
            'Payment complete!'
          ];

          const statusEl = document.getElementById('status');
          let statusIndex = 0;

          const statusInterval = setInterval(() => {
            if (statusIndex < statuses.length - 1) {
              statusIndex++;
              statusEl.textContent = statuses[statusIndex];
            }
          }, 1000);

          function completePayment(status) {
            clearInterval(statusInterval);
            const frontendBase = '${process.env.CORS_ORIGIN || 'http://localhost:5173'}';
            window.location.href = frontendBase + '/payment?status=' + status + '&token=${token}';
          }

          // Auto-complete after 7 seconds with random success
          setTimeout(() => {
            completePayment('SUCCESS');
          }, 7000);
        </script>
      </body>
      </html>
    `);
  }),

  getPaymentStatus: asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const payment = await Payment.findByBookingId(bookingId);
    if (!payment) {
      return httpResponses.notFound(res, 'No payment found for this booking');
    }

    return httpResponses.ok(res, payment);
  }),
};
