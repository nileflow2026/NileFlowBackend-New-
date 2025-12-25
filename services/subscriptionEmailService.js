// services/subscriptionEmailService.js
const { Resend } = require("resend");
const { env } = require("../src/env");
const logger = require("../utils/logger");

const resend = new Resend(env.RESEND_API_KEY);

class SubscriptionEmailService {
  /**
   * Send welcome email after successful subscription
   */
  static async sendWelcomeEmail({
    email,
    name,
    expiresAt,
    subscriptionId,
    amount,
    paymentMethod,
  }) {
    try {
      const expiryDate = new Date(expiresAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      await resend.emails.send({
        from: "Nile Flow <no-reply@nileflowafrica.com>",
        to: email,
        subject: "🎉 Welcome to Nile Premium - Your Subscription is Active!",
        html: this.getWelcomeEmailTemplate({
          name,
          expiryDate,
          subscriptionId,
          amount,
          paymentMethod,
        }),
      });

      logger.info(
        `Welcome email sent to ${email} for subscription ${subscriptionId}`
      );
      return { success: true };
    } catch (error) {
      logger.error(`Failed to send welcome email to ${email}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send reminder email (7 days or 3 days before expiry)
   */
  static async sendReminderEmail({
    email,
    name,
    expiresAt,
    daysRemaining,
    subscriptionId,
  }) {
    try {
      const expiryDate = new Date(expiresAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      await resend.emails.send({
        from: "Nile Flow <no-reply@nileflowafrica.com>",
        to: email,
        subject: `⏰ Your Nile Premium Subscription Expires in ${daysRemaining} Days`,
        html: this.getReminderEmailTemplate({
          name,
          expiryDate,
          daysRemaining,
          subscriptionId,
        }),
      });

      logger.info(
        `Reminder email (${daysRemaining} days) sent to ${email} for subscription ${subscriptionId}`
      );
      return { success: true };
    } catch (error) {
      logger.error(`Failed to send reminder email to ${email}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send auto-renewal confirmation email
   */
  static async sendRenewalEmail({
    email,
    name,
    newExpiresAt,
    subscriptionId,
    amount,
    paymentMethod,
  }) {
    try {
      const newExpiryDate = new Date(newExpiresAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      await resend.emails.send({
        from: "Nile Flow <no-reply@nileflowafrica.com>",
        to: email,
        subject: "✅ Your Nile Premium Subscription Has Been Renewed",
        html: this.getRenewalEmailTemplate({
          name,
          newExpiryDate,
          subscriptionId,
          amount,
          paymentMethod,
        }),
      });

      logger.info(
        `Renewal email sent to ${email} for subscription ${subscriptionId}`
      );
      return { success: true };
    } catch (error) {
      logger.error(`Failed to send renewal email to ${email}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send payment failure notification
   */
  static async sendPaymentFailureEmail({
    email,
    name,
    subscriptionId,
    reason,
  }) {
    try {
      await resend.emails.send({
        from: "Nile Flow <no-reply@nileflowafrica.com>",
        to: email,
        subject:
          "⚠️ Action Required - Nile Premium Subscription Payment Failed",
        html: this.getPaymentFailureEmailTemplate({
          name,
          subscriptionId,
          reason,
        }),
      });

      logger.info(
        `Payment failure email sent to ${email} for subscription ${subscriptionId}`
      );
      return { success: true };
    } catch (error) {
      logger.error(`Failed to send payment failure email to ${email}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Welcome email template
   */
  static getWelcomeEmailTemplate({
    name,
    expiryDate,
    subscriptionId,
    amount,
    paymentMethod,
  }) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Nile Premium</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
              
              body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
                  margin: 0;
                  padding: 40px 20px;
                  color: #e2e8f0;
              }
              
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background: rgba(15, 23, 42, 0.95);
                  border: 1px solid rgba(245, 158, 11, 0.3);
                  border-radius: 24px;
                  overflow: hidden;
                  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
              }
              
              .header {
                  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
                  padding: 50px 30px;
                  text-align: center;
              }
              
              .logo {
                  font-size: 36px;
                  font-weight: 800;
                  color: white;
                  margin: 0 0 10px 0;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              
              .subtitle {
                  color: rgba(255, 255, 255, 0.9);
                  font-size: 18px;
                  margin: 0;
              }
              
              .content {
                  padding: 40px 30px;
              }
              
              .welcome-message {
                  font-size: 24px;
                  font-weight: 600;
                  margin: 0 0 20px 0;
                  color: #f59e0b;
              }
              
              .text {
                  font-size: 16px;
                  line-height: 1.6;
                  color: #cbd5e1;
                  margin: 0 0 20px 0;
              }
              
              .benefits-box {
                  background: rgba(245, 158, 11, 0.1);
                  border: 1px solid rgba(245, 158, 11, 0.3);
                  border-radius: 12px;
                  padding: 25px;
                  margin: 30px 0;
              }
              
              .benefit-item {
                  display: flex;
                  align-items: start;
                  margin: 15px 0;
              }
              
              .check-icon {
                  color: #10b981;
                  font-size: 20px;
                  margin-right: 12px;
                  flex-shrink: 0;
              }
              
              .detail-box {
                  background: rgba(30, 41, 59, 0.8);
                  border-radius: 12px;
                  padding: 20px;
                  margin: 25px 0;
              }
              
              .detail-row {
                  display: flex;
                  justify-content: space-between;
                  padding: 12px 0;
                  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
              }
              
              .detail-row:last-child {
                  border-bottom: none;
              }
              
              .detail-label {
                  color: #94a3b8;
                  font-size: 14px;
              }
              
              .detail-value {
                  color: #e2e8f0;
                  font-weight: 600;
                  font-size: 14px;
              }
              
              .cta-button {
                  display: inline-block;
                  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
                  color: white;
                  text-decoration: none;
                  padding: 16px 40px;
                  border-radius: 12px;
                  font-weight: 600;
                  font-size: 16px;
                  margin: 20px 0;
                  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
              }
              
              .footer {
                  background: rgba(15, 23, 42, 0.5);
                  padding: 30px;
                  text-align: center;
                  font-size: 14px;
                  color: #64748b;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="logo">NILE FLOW</div>
                  <div class="subtitle">Premium Membership</div>
              </div>
              
              <div class="content">
                  <h1 class="welcome-message">🎉 Welcome to Premium, ${name}!</h1>
                  
                  <p class="text">
                      Thank you for subscribing to Nile Premium! Your subscription is now active and you have 
                      full access to all premium features.
                  </p>
                  
                  <div class="benefits-box">
                      <h3 style="margin: 0 0 20px 0; color: #f59e0b;">Your Premium Benefits:</h3>
                      
                      <div class="benefit-item">
                          <span class="check-icon">✓</span>
                          <span>Exclusive access to premium deals and discounts</span>
                      </div>
                      
                      <div class="benefit-item">
                          <span class="check-icon">✓</span>
                          <span>Priority customer support with faster response times</span>
                      </div>
                      
                      <div class="benefit-item">
                          <span class="check-icon">✓</span>
                          <span>Free delivery on all orders (no minimum)</span>
                      </div>
                      
                      <div class="benefit-item">
                          <span class="check-icon">✓</span>
                          <span>Early access to new products and features</span>
                      </div>
                      
                      <div class="benefit-item">
                          <span class="check-icon">✓</span>
                          <span>Monthly premium-only flash sales</span>
                      </div>
                  </div>
                  
                  <div class="detail-box">
                      <div class="detail-row">
                          <span class="detail-label">Subscription ID</span>
                          <span class="detail-value">${subscriptionId}</span>
                      </div>
                      <div class="detail-row">
                          <span class="detail-label">Amount Paid</span>
                          <span class="detail-value">KSH ${amount}</span>
                      </div>
                      <div class="detail-row">
                          <span class="detail-label">Payment Method</span>
                          <span class="detail-value">${paymentMethod.toUpperCase()}</span>
                      </div>
                      <div class="detail-row">
                          <span class="detail-label">Renews On</span>
                          <span class="detail-value">${expiryDate}</span>
                      </div>
                  </div>
                  
                  <p class="text">
                      Your subscription will automatically renew on <strong>${expiryDate}</strong> unless you cancel. 
                      We'll send you a reminder 7 days before your renewal date.
                  </p>
                  
                  <center>
                      <a href="${
                        env.FRONTEND_URL
                      }/subscription" class="cta-button">
                          Manage My Subscription
                      </a>
                  </center>
              </div>
              
              <div class="footer">
                  <p>Questions? Contact us at support@nileflowafrica.com</p>
                  <p style="margin-top: 15px;">
                      © 2025 Nile Flow Africa. All rights reserved.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  /**
   * Reminder email template
   */
  static getReminderEmailTemplate({
    name,
    expiryDate,
    daysRemaining,
    subscriptionId,
  }) {
    const urgencyColor = daysRemaining <= 3 ? "#ef4444" : "#f59e0b";
    const urgencyEmoji = daysRemaining <= 3 ? "🚨" : "⏰";

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Subscription Renewal Reminder</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
              
              body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
                  margin: 0;
                  padding: 40px 20px;
                  color: #e2e8f0;
              }
              
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background: rgba(15, 23, 42, 0.95);
                  border: 1px solid ${urgencyColor};
                  border-radius: 24px;
                  overflow: hidden;
                  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
              }
              
              .header {
                  background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%);
                  padding: 50px 30px;
                  text-align: center;
              }
              
              .title {
                  font-size: 32px;
                  font-weight: 800;
                  color: white;
                  margin: 0;
              }
              
              .content {
                  padding: 40px 30px;
              }
              
              .message {
                  font-size: 20px;
                  font-weight: 600;
                  margin: 0 0 20px 0;
                  color: ${urgencyColor};
              }
              
              .text {
                  font-size: 16px;
                  line-height: 1.6;
                  color: #cbd5e1;
                  margin: 0 0 20px 0;
              }
              
              .countdown-box {
                  background: rgba(${
                    urgencyColor === "#ef4444" ? "239, 68, 68" : "245, 158, 11"
                  }, 0.1);
                  border: 2px solid ${urgencyColor};
                  border-radius: 12px;
                  padding: 30px;
                  text-align: center;
                  margin: 30px 0;
              }
              
              .days-remaining {
                  font-size: 48px;
                  font-weight: 800;
                  color: ${urgencyColor};
                  margin: 0;
              }
              
              .days-label {
                  font-size: 18px;
                  color: #94a3b8;
                  margin: 10px 0 0 0;
              }
              
              .info-box {
                  background: rgba(30, 41, 59, 0.8);
                  border-radius: 12px;
                  padding: 20px;
                  margin: 25px 0;
              }
              
              .cta-button {
                  display: inline-block;
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  color: white;
                  text-decoration: none;
                  padding: 16px 40px;
                  border-radius: 12px;
                  font-weight: 600;
                  font-size: 16px;
                  margin: 10px;
                  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
              }
              
              .cancel-link {
                  display: inline-block;
                  color: #94a3b8;
                  text-decoration: none;
                  padding: 16px 40px;
                  font-size: 14px;
              }
              
              .footer {
                  background: rgba(15, 23, 42, 0.5);
                  padding: 30px;
                  text-align: center;
                  font-size: 14px;
                  color: #64748b;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="title">${urgencyEmoji} Renewal Reminder</div>
              </div>
              
              <div class="content">
                  <h1 class="message">Hi ${name},</h1>
                  
                  <p class="text">
                      Your Nile Premium subscription will renew soon. Your benefits and premium access will 
                      continue uninterrupted.
                  </p>
                  
                  <div class="countdown-box">
                      <div class="days-remaining">${daysRemaining}</div>
                      <div class="days-label">Days Until Renewal</div>
                  </div>
                  
                  <div class="info-box">
                      <p style="margin: 0 0 10px 0; color: #94a3b8;">Renewal Date:</p>
                      <p style="margin: 0; font-size: 18px; font-weight: 600;">${expiryDate}</p>
                  </div>
                  
                  <p class="text">
                      <strong>What happens next:</strong><br>
                      On ${expiryDate}, your subscription will automatically renew using your saved payment method. 
                      You'll continue enjoying all premium benefits without interruption.
                  </p>
                  
                  <p class="text">
                      Don't want to renew? You can cancel anytime before ${expiryDate} and you'll still have 
                      access to premium features until then.
                  </p>
                  
                  <center>
                      <a href="${
                        env.FRONTEND_URL
                      }/subscription" class="cta-button">
                          Keep My Premium Access
                      </a>
                      <br>
                      <a href="${
                        env.FRONTEND_URL
                      }/subscription/cancel" class="cancel-link">
                          Cancel Auto-Renewal
                      </a>
                  </center>
              </div>
              
              <div class="footer">
                  <p>Subscription ID: ${subscriptionId}</p>
                  <p style="margin-top: 15px;">
                      Questions? Contact us at support@nileflowafrica.com
                  </p>
                  <p style="margin-top: 15px;">
                      © 2025 Nile Flow Africa. All rights reserved.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  /**
   * Renewal email template
   */
  static getRenewalEmailTemplate({
    name,
    newExpiryDate,
    subscriptionId,
    amount,
    paymentMethod,
  }) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Subscription Renewed</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
              
              body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
                  margin: 0;
                  padding: 40px 20px;
                  color: #e2e8f0;
              }
              
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background: rgba(15, 23, 42, 0.95);
                  border: 1px solid rgba(16, 185, 129, 0.3);
                  border-radius: 24px;
                  overflow: hidden;
                  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
              }
              
              .header {
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  padding: 50px 30px;
                  text-align: center;
              }
              
              .logo {
                  font-size: 48px;
                  margin: 0 0 10px 0;
              }
              
              .title {
                  font-size: 28px;
                  font-weight: 800;
                  color: white;
                  margin: 0;
              }
              
              .content {
                  padding: 40px 30px;
              }
              
              .message {
                  font-size: 24px;
                  font-weight: 600;
                  margin: 0 0 20px 0;
                  color: #10b981;
              }
              
              .text {
                  font-size: 16px;
                  line-height: 1.6;
                  color: #cbd5e1;
                  margin: 0 0 20px 0;
              }
              
              .detail-box {
                  background: rgba(30, 41, 59, 0.8);
                  border-radius: 12px;
                  padding: 20px;
                  margin: 25px 0;
              }
              
              .detail-row {
                  display: flex;
                  justify-content: space-between;
                  padding: 12px 0;
                  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
              }
              
              .detail-row:last-child {
                  border-bottom: none;
              }
              
              .detail-label {
                  color: #94a3b8;
                  font-size: 14px;
              }
              
              .detail-value {
                  color: #e2e8f0;
                  font-weight: 600;
                  font-size: 14px;
              }
              
              .cta-button {
                  display: inline-block;
                  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
                  color: white;
                  text-decoration: none;
                  padding: 16px 40px;
                  border-radius: 12px;
                  font-weight: 600;
                  font-size: 16px;
                  margin: 20px 0;
                  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
              }
              
              .footer {
                  background: rgba(15, 23, 42, 0.5);
                  padding: 30px;
                  text-align: center;
                  font-size: 14px;
                  color: #64748b;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="logo">✅</div>
                  <div class="title">Subscription Renewed</div>
              </div>
              
              <div class="content">
                  <h1 class="message">Thanks for staying with us, ${name}!</h1>
                  
                  <p class="text">
                      Your Nile Premium subscription has been successfully renewed. Your premium benefits 
                      continue for another 30 days!
                  </p>
                  
                  <div class="detail-box">
                      <div class="detail-row">
                          <span class="detail-label">Subscription ID</span>
                          <span class="detail-value">${subscriptionId}</span>
                      </div>
                      <div class="detail-row">
                          <span class="detail-label">Amount Charged</span>
                          <span class="detail-value">KSH ${amount}</span>
                      </div>
                      <div class="detail-row">
                          <span class="detail-label">Payment Method</span>
                          <span class="detail-value">${paymentMethod.toUpperCase()}</span>
                      </div>
                      <div class="detail-row">
                          <span class="detail-label">Next Renewal Date</span>
                          <span class="detail-value">${newExpiryDate}</span>
                      </div>
                  </div>
                  
                  <p class="text">
                      You're all set! Continue enjoying exclusive deals, free delivery, and priority support.
                  </p>
                  
                  <center>
                      <a href="${
                        env.FRONTEND_URL
                      }/premium-deals" class="cta-button">
                          Browse Premium Deals
                      </a>
                  </center>
              </div>
              
              <div class="footer">
                  <p>Need to make changes? <a href="${
                    env.FRONTEND_URL
                  }/subscription" style="color: #f59e0b;">Manage your subscription</a></p>
                  <p style="margin-top: 15px;">
                      © 2025 Nile Flow Africa. All rights reserved.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  /**
   * Payment failure email template
   */
  static getPaymentFailureEmailTemplate({ name, subscriptionId, reason }) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Issue</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
              
              body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
                  margin: 0;
                  padding: 40px 20px;
                  color: #e2e8f0;
              }
              
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background: rgba(15, 23, 42, 0.95);
                  border: 1px solid rgba(239, 68, 68, 0.3);
                  border-radius: 24px;
                  overflow: hidden;
                  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
              }
              
              .header {
                  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                  padding: 50px 30px;
                  text-align: center;
              }
              
              .logo {
                  font-size: 48px;
                  margin: 0 0 10px 0;
              }
              
              .title {
                  font-size: 28px;
                  font-weight: 800;
                  color: white;
                  margin: 0;
              }
              
              .content {
                  padding: 40px 30px;
              }
              
              .message {
                  font-size: 20px;
                  font-weight: 600;
                  margin: 0 0 20px 0;
                  color: #ef4444;
              }
              
              .text {
                  font-size: 16px;
                  line-height: 1.6;
                  color: #cbd5e1;
                  margin: 0 0 20px 0;
              }
              
              .alert-box {
                  background: rgba(239, 68, 68, 0.1);
                  border: 1px solid rgba(239, 68, 68, 0.3);
                  border-radius: 12px;
                  padding: 20px;
                  margin: 25px 0;
              }
              
              .cta-button {
                  display: inline-block;
                  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
                  color: white;
                  text-decoration: none;
                  padding: 16px 40px;
                  border-radius: 12px;
                  font-weight: 600;
                  font-size: 16px;
                  margin: 20px 0;
                  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
              }
              
              .footer {
                  background: rgba(15, 23, 42, 0.5);
                  padding: 30px;
                  text-align: center;
                  font-size: 14px;
                  color: #64748b;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="logo">⚠️</div>
                  <div class="title">Action Required</div>
              </div>
              
              <div class="content">
                  <h1 class="message">Hi ${name},</h1>
                  
                  <p class="text">
                      We were unable to process your subscription renewal payment. Your premium benefits 
                      will expire soon if we can't complete the payment.
                  </p>
                  
                  <div class="alert-box">
                      <p style="margin: 0; color: #cbd5e1;">
                          <strong>Reason:</strong> ${
                            reason || "Payment method declined"
                          }
                      </p>
                  </div>
                  
                  <p class="text">
                      <strong>What you can do:</strong>
                  </p>
                  <ul style="color: #cbd5e1; line-height: 1.8;">
                      <li>Update your payment method</li>
                      <li>Ensure your account has sufficient funds</li>
                      <li>Try a different payment method</li>
                  </ul>
                  
                  <p class="text">
                      Please update your payment information to keep your premium access active.
                  </p>
                  
                  <center>
                      <a href="${
                        env.FRONTEND_URL
                      }/subscription/payment" class="cta-button">
                          Update Payment Method
                      </a>
                  </center>
              </div>
              
              <div class="footer">
                  <p>Subscription ID: ${subscriptionId}</p>
                  <p style="margin-top: 15px;">
                      Need help? Contact us at support@nileflowafrica.com
                  </p>
                  <p style="margin-top: 15px;">
                      © 2025 Nile Flow Africa. All rights reserved.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;
  }
}

module.exports = SubscriptionEmailService;
