const { Resend } = require("resend");
const { env } = require("../src/env");

const resend = new Resend(env.RESEND_API_KEY);

/**
 * Send rating request email to customer using Resend
 */
async function sendRatingRequestEmail(deliveryData) {
  try {
    const {
      customerEmail,
      customerName,
      deliveryId,
      orderId,
      riderName,
      totalAmount,
      ratingUrl,
    } = deliveryData;

    if (!customerEmail) {
      // console.log("❌ No customer email available for rating request");
      return false;
    }

    // console.log(`📨 Preparing to send rating request email:`);
    // console.log(`  ✉️  To: ${customerEmail}`);
    // console.log(`  🚚 Order: #${orderId}`);
    // console.log(`  🚴 Delivery: ${deliveryId}`);
    // console.log(`  👤 Rider: ${riderName}`);
    // console.log(`  💰 Amount: $${totalAmount}`);
    // console.log(`  🔗 Rating URL: ${ratingUrl}`);
    // console.log(`  📅 Timestamp: ${new Date().toISOString()}`);

    const emailResponse = await resend.emails.send({
      from: "Nile Flow <no-reply@nileflowafrica.com>",
      to: customerEmail,
      subject: `⭐ Rate Your Delivery Experience - Order #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Rate Your Delivery | Nile Flow Africa</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
                    margin: 0;
                    padding: 40px 20px;
                    color: #e2e8f0;
                    line-height: 1.6;
                }
                
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: rgba(15, 23, 42, 0.8);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(245, 158, 11, 0.2);
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }
                
                .header {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    padding: 40px 30px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                }
                
                .logo {
                    font-size: 32px;
                    font-weight: 800;
                    margin: 0;
                    background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    position: relative;
                    z-index: 1;
                }
                
                .logo-sub {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.8);
                    letter-spacing: 2px;
                    margin-top: 8px;
                    position: relative;
                    z-index: 1;
                }
                
                .content {
                    padding: 40px 30px;
                }
                
                .greeting {
                    font-size: 28px;
                    font-weight: 700;
                    margin: 0 0 20px 0;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .delivery-success {
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 12px;
                    padding: 20px;
                    margin: 25px 0;
                    text-align: center;
                }
                
                .success-icon {
                    font-size: 48px;
                    margin-bottom: 10px;
                }
                
                .delivery-text {
                    font-size: 18px;
                    color: #10b981;
                    font-weight: 600;
                    margin: 0;
                }
                
                .order-details {
                    background: rgba(30, 41, 59, 0.5);
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    border-radius: 16px;
                    padding: 25px;
                    margin: 30px 0;
                }
                
                .order-title {
                    color: #fbbf24;
                    font-weight: 600;
                    margin-bottom: 15px;
                    font-size: 18px;
                }
                
                .order-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    padding: 8px 0;
                    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
                }
                
                .order-info:last-child {
                    border-bottom: none;
                    margin-bottom: 0;
                }
                
                .order-label {
                    color: #94a3b8;
                    font-weight: 500;
                }
                
                .order-value {
                    color: #f8fafc;
                    font-weight: 600;
                }
                
                .total-amount {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 20px;
                    font-weight: 700;
                }
                
                .rating-section {
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%);
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    border-radius: 16px;
                    padding: 30px;
                    margin: 30px 0;
                    text-align: center;
                }
                
                .rating-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: #fbbf24;
                    margin-bottom: 15px;
                }
                
                .stars {
                    font-size: 32px;
                    margin: 20px 0;
                    letter-spacing: 4px;
                }
                
                .rating-description {
                    color: #cbd5e1;
                    font-size: 16px;
                    margin-bottom: 25px;
                    line-height: 1.5;
                }
                
                .rating-btn {
                    display: inline-block;
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                    text-decoration: none;
                    padding: 16px 32px;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 18px;
                    text-align: center;
                    margin: 10px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
                }
                
                .rating-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 25px rgba(245, 158, 11, 0.4);
                }
                
                .rider-section {
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 16px;
                    padding: 25px;
                    margin: 30px 0;
                    text-align: center;
                }
                
                .rider-title {
                    color: #60a5fa;
                    font-weight: 600;
                    margin-bottom: 15px;
                    font-size: 18px;
                }
                
                .rider-name {
                    font-size: 20px;
                    font-weight: 700;
                    color: #f8fafc;
                    margin-bottom: 10px;
                }
                
                .rider-text {
                    color: #cbd5e1;
                    margin: 0;
                }
                
                .why-rate {
                    background: rgba(30, 41, 59, 0.5);
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    border-radius: 16px;
                    padding: 25px;
                    margin: 30px 0;
                }
                
                .why-title {
                    color: #ec4899;
                    font-weight: 600;
                    margin-bottom: 15px;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .why-text {
                    color: #cbd5e1;
                    margin: 0;
                    line-height: 1.6;
                }
                
                .signature {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 30px;
                    border-top: 1px solid rgba(148, 163, 184, 0.1);
                }
                
                .team-name {
                    font-size: 18px;
                    font-weight: 700;
                    color: #10b981;
                    margin: 10px 0 5px 0;
                }
                
                .team-title {
                    color: #94a3b8;
                    font-size: 14px;
                }
                
                .footer {
                    background: rgba(15, 23, 42, 0.9);
                    padding: 30px;
                    text-align: center;
                    border-top: 1px solid rgba(16, 185, 129, 0.2);
                }
                
                .footer-links {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin: 20px 0;
                }
                
                .footer-link {
                    color: #94a3b8;
                    text-decoration: none;
                    font-size: 14px;
                    transition: color 0.3s ease;
                }
                
                .footer-link:hover {
                    color: #10b981;
                }
                
                .copyright {
                    font-size: 12px;
                    color: #64748b;
                    margin-top: 20px;
                }
                
                @media (max-width: 600px) {
                    body {
                        padding: 20px 10px;
                    }
                    
                    .content {
                        padding: 25px 20px;
                    }
                    
                    .header {
                        padding: 30px 20px;
                    }
                    
                    .logo {
                        font-size: 26px;
                    }
                    
                    .greeting {
                        font-size: 24px;
                    }
                    
                    .rating-title {
                        font-size: 20px;
                    }
                    
                    .rating-btn {
                        font-size: 16px;
                        padding: 14px 28px;
                    }
                    
                    .stars {
                        font-size: 28px;
                        letter-spacing: 2px;
                    }
                    
                    .footer-links {
                        flex-direction: column;
                        gap: 10px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Header -->
                <div class="header">
                    <h1 class="logo">NILE FLOW</h1>
                    <div class="logo-sub">PREMIUM AFRICAN MARKETPLACE</div>
                </div>
                
                <!-- Content -->
                <div class="content">
                    <h2 class="greeting">Hello ${
                      customerName || "Valued Customer"
                    },</h2>
                    
                    <!-- Delivery Success -->
                    <div class="delivery-success">
                        <div class="success-icon">🎉✨</div>
                        <p class="delivery-text">Your order has been delivered successfully!</p>
                    </div>
                    
                    <!-- Order Details -->
                    <div class="order-details">
                        <div class="order-title">📦 Order Summary</div>
                        <div class="order-info">
                            <span class="order-label">Order ID:</span>
                            <span class="order-value">#${orderId}</span>
                        </div>
                        <div class="order-info">
                            <span class="order-label">Delivery ID:</span>
                            <span class="order-value">${deliveryId}</span>
                        </div>
                        <div class="order-info">
                            <span class="order-label">Total Amount:</span>
                            <span class="order-value total-amount">$${totalAmount}</span>
                        </div>
                        <div class="order-info">
                            <span class="order-label">Delivery Date:</span>
                            <span class="order-value">${new Date().toLocaleDateString(
                              "en-US",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}</span>
                        </div>
                    </div>
                    
                    <!-- Rider Information -->
                    <div class="rider-section">
                        <div class="rider-title">🚴‍♂️ Your Delivery Rider</div>
                        <div class="rider-name">${riderName}</div>
                        <p class="rider-text">
                            Your order was carefully delivered by ${riderName}, one of our dedicated delivery partners.
                        </p>
                    </div>
                    
                    <!-- Rating Section -->
                    <div class="rating-section">
                        <h3 class="rating-title">How was your delivery experience?</h3>
                        <div class="stars">⭐⭐⭐⭐⭐</div>
                        <p class="rating-description">
                            Your feedback helps us maintain excellent service standards and recognize our outstanding riders. 
                            It only takes a minute to share your experience!
                        </p>
                        <a href="${ratingUrl}" class="rating-btn">⭐ Rate Your Delivery Experience</a>
                    </div>
                    
                    <!-- Why Rate Section -->
                    <div class="why-rate">
                        <div class="why-title">💫 Why Your Rating Matters</div>
                        <p class="why-text">
                            • Helps us recognize and reward exceptional riders<br>
                            • Enables us to continuously improve our service quality<br>
                            • Assists other customers in making informed decisions<br>
                            • Contributes to building a trusted delivery community
                        </p>
                    </div>
                    
                    <!-- Signature -->
                    <div class="signature">
                        <div class="team-name">The Nile Flow Team</div>
                        <div class="team-title">Celebrating African Excellence</div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="footer">
                    <div class="footer-links">
                        <a href="https://nileflowafrica.com" class="footer-link">Visit Our Store</a>
                        <a href="https://nileflowafrica.com/orders" class="footer-link">Order History</a>
                        <a href="https://nileflowafrica.com/contact" class="footer-link">Contact Support</a>
                    </div>
                    
                    <div class="copyright">
                        © ${new Date().getFullYear()} Nile Flow. All rights reserved.<br>
                        Nairobi, Kenya | Premium African Marketplace<br><br>
                        This email was sent to ${customerEmail}<br>
                        If you have any questions, please don't hesitate to contact our support team.
                    </div>
                </div>
            </div>
        </body>
        </html>
      `,
    });

    // console.log(`✅ Rating request email SENT successfully!`);
    // console.log(`  📧 Email ID: ${emailResponse.data?.id || "N/A"}`);
    // console.log(`  ✉️  To: ${customerEmail}`);
    // console.log(`  🚚 Order: #${orderId}`);
    // console.log(`  🚴 Delivery: ${deliveryId}`);
    // console.log(`  📊 Response:`, JSON.stringify(emailResponse, null, 2));
    // console.log(`  ⏰ Sent at: ${new Date().toISOString()}`);
    return true;
  } catch (error) {
    console.error(`❌ FAILED to send rating request email!`);
    console.error(`  ✉️  To: ${customerEmail}`);
    console.error(`  🚚 Order: #${orderId}`);
    console.error(`  🚴 Delivery: ${deliveryId}`);
    console.error(`  🔧 Error Type: ${error.name || "Unknown"}`);
    console.error(`  💬 Error Message: ${error.message}`);
    console.error(`  📊 Full Error:`, error);
    console.error(`  ⏰ Failed at: ${new Date().toISOString()}`);
    return false;
  }
}

/**
 * Schedule rating reminder email (send 4 hours after delivery if not rated)
 */
async function scheduleRatingReminder(deliveryId) {
  // console.log(`⏰ Scheduling rating reminder for delivery: ${deliveryId}`);
  // console.log(
  //   `  📅 Will send in 4 hours at: ${new Date(
  //     Date.now() + 4 * 60 * 60 * 1000
  //   ).toISOString()}`
  // );

  // In a production app, use a job queue like Bull or Agenda
  // For now, we'll use setTimeout (not recommended for production)
  setTimeout(async () => {
    try {
      // console.log(`🔔 Executing rating reminder for delivery: ${deliveryId}`);

      const {
        getRatingReminder,
      } = require("../controllers/RatingController/ratingController");

      // Check if still needs rating
      // console.log(
      //   `📋 Checking if delivery ${deliveryId} still needs rating...`
      // );
      const response = await getRatingReminder(
        { params: { deliveryId } },
        {
          json: (data) => data,
          status: (code) => ({ json: (data) => data }),
        }
      );

      if (response.success) {
        // console.log(
        //   `✅ Delivery ${deliveryId} still needs rating - sending reminder email`
        // );
        const reminderSent = await sendRatingRequestEmail({
          ...response.reminderData,
          ratingUrl: response.reminderData.ratingUrl,
        });

        if (reminderSent) {
          // console.log(
          //   `📧 Rating reminder email sent successfully for delivery: ${deliveryId}`
          // );
        } else {
          // console.log(
          //   `❌ Rating reminder email failed for delivery: ${deliveryId}`
          // );
        }
      } else {
        // console.log(
        //   `⏭️ Delivery ${deliveryId} no longer needs rating - skipping reminder`
        // );
      }
    } catch (error) {
      console.error(
        `❌ Failed to send rating reminder for delivery ${deliveryId}:`,
        error
      );
    }
  }, 4 * 60 * 60 * 1000); // 4 hours in milliseconds
}

module.exports = {
  sendRatingRequestEmail,
  scheduleRatingReminder,
};
