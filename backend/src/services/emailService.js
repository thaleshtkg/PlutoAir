import nodemailer from 'nodemailer';

// Mock SMTP Transporter (using Ethereal Email for testing, or configure real SMTP)
let transporter;

const initializeMailer = () => {
  // For production, use real SMTP or SendGrid
  if (process.env.NODE_ENV === 'production') {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Mock transporter for development (logs to console)
    transporter = {
      sendMail: async (options) => {
        console.log('\n📧 Email Sent (Mock):');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Body:', options.html);
        console.log('---\n');
        return { messageId: `mock-${Date.now()}` };
      },
    };
  }
};

initializeMailer();

export const emailService = {
  // Send booking confirmation email
  sendBookingConfirmation: async (userEmail, bookingData) => {
    try {
      const { booking_ref, passengers, flight, total_amount, travel_date } = bookingData;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
            .section { margin: 20px 0; padding: 15px; border: 1px solid #eee; border-radius: 5px; }
            .label { font-weight: bold; color: #667eea; }
            .value { margin-left: 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            .footer { font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Booking Confirmed!</h1>
              <p>Thank you for booking with us</p>
            </div>

            <div class="section">
              <p><span class="label">Booking Reference:</span> <span class="value">${booking_ref}</span></p>
              <p><span class="label">Total Amount:</span> <span class="value">₹${total_amount.toFixed(2)}</span></p>
            </div>

            <div class="section">
              <h2>Flight Details</h2>
              <p><span class="label">Flight:</span> <span class="value">${flight.airline_id} ${flight.flight_number}</span></p>
              <p><span class="label">Date:</span> <span class="value">${new Date(travel_date).toLocaleDateString('en-IN')}</span></p>
              <p><span class="label">Route:</span> <span class="value">${flight.origin_id} → ${flight.destination_id}</span></p>
            </div>

            <div class="section">
              <h2>Passengers</h2>
              ${passengers.map(p => `<p>• ${p.full_name} (${p.age_category})</p>`).join('')}
            </div>

            <div class="section">
              <p>Your ticket details have been sent to your email. Please keep your booking reference safe.</p>
            </div>

            <a href="https://flightbooking.com/booking/${booking_ref}" class="button">View Booking</a>

            <div class="footer">
              <p>This is an automated email. Please do not reply to this email address.</p>
              <p>&copy; 2026 Flight Booking System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const result = await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@flightbooking.com',
        to: userEmail,
        subject: `Booking Confirmed - Reference: ${booking_ref}`,
        html,
      });

      console.log('✓ Confirmation email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('✗ Failed to send confirmation email:', error);
      throw error;
    }
  },

  // Send ticket email
  sendTicketEmail: async (userEmail, ticketData) => {
    try {
      const { booking_ref, passengers, total_amount } = ticketData;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Courier New', monospace; color: #333; }
            .ticket {
              max-width: 600px; margin: 20px auto;
              border: 2px dashed #667eea;
              padding: 30px;
              background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
              border-radius: 5px;
            }
            .ticket-header { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .ticket-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dotted #ddd; }
            .ticket-label { color: #667eea; font-weight: bold; }
            .separator { border: 2px dashed #667eea; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="ticket-header">✈ BOARDING PASS</div>

            <div class="ticket-row">
              <span class="ticket-label">Booking Reference</span>
              <span>${booking_ref}</span>
            </div>

            <div class="ticket-row">
              <span class="ticket-label">Total Amount</span>
              <span>₹${total_amount.toFixed(2)}</span>
            </div>

            <div class="separator"></div>

            <h3>Passengers</h3>
            ${passengers.map(p => `
              <div class="ticket-row">
                <span>• ${p.full_name}</span>
                <span>${p.age_category}</span>
              </div>
            `).join('')}

            <div class="separator"></div>

            <p style="font-size: 12px; color: #999; text-align: center;">
              This is your electronic ticket. Keep it safe for check-in.
            </p>
          </div>
        </body>
        </html>
      `;

      const result = await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@flightbooking.com',
        to: userEmail,
        subject: `Your Ticket - ${booking_ref}`,
        html,
      });

      console.log('✓ Ticket email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('✗ Failed to send ticket email:', error);
      throw error;
    }
  },

  // Send password reset email
  sendPasswordReset: async (userEmail, resetToken) => {
    try {
      const resetLink = `https://flightbooking.com/reset-password?token=${resetToken}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password. Click the link below to proceed:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>This link expires in 1 hour.</p>
            <p style="font-size: 12px; color: #999;">If you didn't request this, please ignore this email.</p>
          </div>
        </body>
        </html>
      `;

      const result = await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@flightbooking.com',
        to: userEmail,
        subject: 'Password Reset Request',
        html,
      });

      console.log('✓ Password reset email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('✗ Failed to send password reset email:', error);
      throw error;
    }
  },

  // Send account verification email
  sendVerificationEmail: async (userEmail, verificationCode) => {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .code {
              background: #f5f5f5;
              padding: 20px;
              text-align: center;
              font-size: 32px;
              letter-spacing: 5px;
              font-weight: bold;
              color: #667eea;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Welcome!</h2>
            <p>Thank you for creating an account. Please verify your email using this code:</p>
            <div class="code">${verificationCode}</div>
            <p>This code expires in 24 hours.</p>
          </div>
        </body>
        </html>
      `;

      const result = await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@flightbooking.com',
        to: userEmail,
        subject: 'Verify Your Email',
        html,
      });

      console.log('✓ Verification email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('✗ Failed to send verification email:', error);
      throw error;
    }
  },
};

export default emailService;
