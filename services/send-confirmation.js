const { Resend } = require("resend");
const { env } = require("../src/env");
const { db, users } = require("./appwriteService");
const { Query, ID } = require("node-appwrite");
const bcrypt = require("bcrypt");
const {
  generateAuthTokens,
  generateRefreshToken,
} = require("../utils/tokenUtils");
const resend = new Resend(env.RESEND_API_KEY);

// Helper function to get user by email
const getUserByEmail = async (email) => {
  try {
    const response = await db.listDocuments(
      env.APPWRITE_DATABASE_ID, // Your database ID
      env.APPWRITE_USER_COLLECTION_ID, // Your users collection ID
      [Query.equal("email", email), Query.limit(1)],
    );

    if (response.documents.length === 0) {
      return null;
    }

    // Return the first (and should be only) user document
    return response.documents[0];
  } catch (error) {
    console.error("Error fetching user by email from Appwrite:", error);
    throw error;
  }
};

const sendOrderConfirmationEmail = async ({
  customerEmail,
  customerName,
  orderId,
  orderTotal,
  cart,
}) => {
  console.log("Preparing to send email to:", customerEmail);
  console.log("cart passed to email:", cart);

  try {
    await resend.emails.send({
      from: "Nile Flow <no-reply@nileflowafrica.com>",
      to: customerEmail,
      subject: `🎉 Order #${orderId} Confirmed | Nile Flow`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation | Nile Flow Africa</title>
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
                    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
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
                    background: linear-gradient(135deg, #ffffff 0%, #fef3c7 100%);
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
                    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .order-number {
                    background: rgba(245, 158, 11, 0.1);
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    border-radius: 12px;
                    padding: 15px;
                    margin: 25px 0;
                    text-align: center;
                }
                
                .order-number span {
                    font-size: 20px;
                    font-weight: 700;
                    color: #fbbf24;
                }
                
                .thank-you {
                    font-size: 18px;
                    color: #cbd5e1;
                    margin-bottom: 30px;
                }
                
                .order-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin: 30px 0;
                    border-radius: 16px;
                    overflow: hidden;
                    background: rgba(30, 41, 59, 0.5);
                    border: 1px solid rgba(148, 163, 184, 0.1);
                }
                
                .order-table thead {
                    background: linear-gradient(135deg, rgba(214, 149, 22, 0.2) 0%, rgba(179, 83, 9, 0.2) 100%);
                }
                
                .order-table th {
                    padding: 20px;
                    text-align: left;
                    font-weight: 600;
                    color: #fbbf24;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-bottom: 1px solid rgba(245, 158, 11, 0.2);
                }
                
                .order-table td {
                    padding: 20px;
                    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
                }
                
                .product-cell {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .product-image {
                    width: 70px;
                    height: 70px;
                    border-radius: 12px;
                    object-fit: cover;
                    border: 2px solid rgba(245, 158, 11, 0.3);
                }
                
                .product-name {
                    font-weight: 600;
                    color: #f8fafc;
                }
                
                .product-price {
                    color: #10b981;
                    font-weight: 600;
                }
                
                .quantity-badge {
                    background: rgba(245, 158, 11, 0.15);
                    color: #fbbf24;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 14px;
                }
                
                .total-section {
                    text-align: right;
                    margin: 30px 0;
                    padding: 25px;
                    background: linear-gradient(135deg, rgba(21, 128, 61, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
                    border-radius: 16px;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }
                
                .total-label {
                    font-size: 16px;
                    color: #94a3b8;
                    margin-bottom: 8px;
                }
                
                .total-amount {
                    font-size: 36px;
                    font-weight: 800;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin: 0;
                }
                
                .track-order-btn {
                    display: inline-block;
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                    text-decoration: none;
                    padding: 16px 32px;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 16px;
                    text-align: center;
                    margin: 30px auto;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
                }
                
                .track-order-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 25px rgba(245, 158, 11, 0.4);
                }
                
                .info-box {
                    background: rgba(30, 41, 59, 0.5);
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    border-radius: 16px;
                    padding: 20px;
                    margin: 30px 0;
                }
                
                .info-title {
                    color: #60a5fa;
                    font-weight: 600;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .info-text {
                    color: #cbd5e1;
                    margin: 0;
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
                    color: #fbbf24;
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
                    border-top: 1px solid rgba(245, 158, 11, 0.2);
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
                    color: #fbbf24;
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
                    
                    .order-table th,
                    .order-table td {
                        padding: 15px 10px;
                    }
                    
                    .product-cell {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 10px;
                    }
                    
                    .product-image {
                        width: 60px;
                        height: 60px;
                    }
                    
                    .total-amount {
                        font-size: 30px;
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
                    <h2 class="greeting">Hello ${customerName},</h2>
                    
                    <p class="thank-you">
                        Thank you for choosing Nile Flow! We're honored to bring premium African products to your doorstep.
                    </p>
                    
                    <div class="order-number">
                        Your order is confirmed • <span>#${orderId}</span>
                    </div>
                    
                    <!-- Order Items -->
                    <table class="order-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                              Array.isArray(cart)
                                ? cart
                                    .map(
                                      (item) => `
                                    <tr>
                                        <td>
                                            <div class="product-cell">
                                                <img src="${
                                                  item.productImage
                                                }" alt="${
                                                  item.productName
                                                }" class="product-image">
                                                <div>
                                                    <div class="product-name">${
                                                      item.productName
                                                    }</div>
                                                    <div class="product-price">Ksh ${item.price.toFixed(
                                                      2,
                                                    )} each</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="quantity-badge">${
                                              item.quantity
                                            }</div>
                                        </td>
                                        <td class="product-price">Ksh ${(
                                          item.price * item.quantity
                                        ).toFixed(2)}</td>
                                    </tr>
                                `,
                                    )
                                    .join("")
                                : ""
                            }
                        </tbody>
                    </table>
                    
                    <!-- Total -->
                    <div class="total-section">
                        <div class="total-label">Total Amount</div>
                        <div class="total-amount">Ksh ${orderTotal.toFixed(
                          2,
                        )}</div>
                    </div>
                    
                    <!-- Track Order Button -->
                    <div style="text-align: center;">
                        <a href="https://nileflowafrica.com/track/${orderId}" class="track-order-btn">
                            🚚 Track Your Order
                        </a>
                    </div>
                    
                    <!-- Shipping Info -->
                    <div class="info-box">
                        <div class="info-title">📦 Shipping Information</div>
                        <p class="info-text">
                            Your order is being prepared by our team. We'll send you another email as soon as it ships. 
                            Delivery typically takes 3-7 business days for domestic orders.
                        </p>
                    </div>
                    
                    <!-- Support Info -->
                    <div class="info-box">
                        <div class="info-title">💬 Need Help?</div>
                        <p class="info-text">
                            Questions about your order? Reply to this email or contact our support team at 
                            <a href="mailto:support@nileflowafrica.com" style="color: #60a5fa; text-decoration: none;">support@nileflowafrica.com</a>. 
                            We're here to help!
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
                        <a href="https://nileflowafrica.com/contact" class="footer-link">Contact Us</a>
                    </div>
                    
                    <div class="copyright">
                        © ${new Date().getFullYear()} Nile Flow. All rights reserved.<br>
                        Nairobi, Kenya | Premium African Marketplace
                    </div>
                </div>
            </div>
        </body>
        </html>
      `,
    });
  } catch (err) {
    console.error("Email sending failed:", err);
    throw err;
  }
};

// Store refresh token in Appwrite with your existing schema
const storeRefreshToken = async (
  userId,
  refreshToken,
  deviceId,
  req = null,
) => {
  try {
    // Hash the refresh token for security
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Extract IP and User Agent from request (if available)
    const ip =
      req?.ip ||
      req?.headers["x-forwarded-for"] ||
      req?.connection?.remoteAddress ||
      "unknown";
    const userAgent = req?.headers["user-agent"] || "unknown";

    // Create document in refresh tokens collection
    const docId = ID.unique();

    await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
      docId,
      {
        userId,
        refreshToken: hashedRefreshToken,
        expiresAt,
        revoked: false,
        createdAt: new Date().toISOString(),
        ip,
        userAgent,
        deviceId: deviceId || "unknown",
        rotatedFrom: null, // No previous token on initial creation
      },
    );

    console.log(`✅ Refresh token stored for user: ${userId}`);
    return docId; // Return document ID in case you need it
  } catch (error) {
    console.error("Error storing refresh token:", error);
    throw error;
  }
};

const sendOrderStatusUpdateEmail = async ({
  customerEmail,
  customerName,
  orderId,
  newStatus,
}) => {
  try {
    await resend.emails.send({
      from: "Nile Flow <orders@nileflowafrica.com>",
      to: customerEmail,
      subject: `Update on Order #${orderId}`,
      html: `
  <div style="
    font-family: 'Helvetica Neue', Arial, sans-serif; 
    background-color: #f9fafb; 
    padding: 40px 0; 
    color: #333;
  ">
    <div style="
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff; 
      border-radius: 10px; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      overflow: hidden;
      border: 1px solid #e0e0e0;
    ">
      <div style="
        background-color: #004aad; 
        padding: 25px 20px; 
        text-align: center;
        color: #ffffff;
        font-size: 24px;
        font-weight: 700;
        letter-spacing: 1px;
      ">
        Nile Flow
      </div>

      <div style="padding: 30px 25px; font-size: 16px; line-height: 1.6;">
        <h2 style="margin-top: 0; color: #222;">Hi ${customerName},</h2>

        <p style="font-size: 18px; font-weight: 600; margin: 20px 0 10px;">
          Your order <strong>#${orderId}</strong> has been 
          <span style="color: #0070f3;">${newStatus.toUpperCase()}</span>.
        </p>

        <p style="margin-bottom: 30px; color: #555;">
          We'll keep you posted on the next steps. Thanks for shopping with us.
        </p>

        <p style="font-style: italic; color: #888; margin-top: 40px;">
          — The Nile Flow Team
        </p>
      </div>

      <div style="
        background-color: #f1f5f9; 
        padding: 15px 20px; 
        text-align: center; 
        font-size: 12px; 
        color: #999;
        border-top: 1px solid #e0e0e0;
      ">
        Nile Flow | Nairobi, Kenya | <a href="mailto:support@nileflowafrica.com" style="color: #999; text-decoration: none;">support@nileflowafrica.com</a>
      </div>
    </div>
  </div>
`,
    });
  } catch (error) {
    console.error("Failed to send status update email:", error);
  }
};

// --- New function to send the verification email
const sendVerificationEmail = async ({
  customerEmail,
  customerName,
  verificationCode,
}) => {
  try {
    await resend.emails.send({
      from: "Nile Flow <no-reply@nileflowafrica.com>", // Your verified Resend domain
      to: customerEmail,
      subject: "Verify Your Nile Flow Account",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7f7f7;">
          <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333;">Hello ${customerName},</h2>
            <p style="font-size: 16px; color: #555;">Thank you for signing up with Nile Flow! Please use the following code to verify your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 28px; font-weight: bold; color: #1c1c1c; background-color: #f0f0f0; padding: 15px 25px; border-radius: 6px; letter-spacing: 2px;">
                ${verificationCode}
              </span>
            </div>
            <p style="font-size: 16px; color: #555;">This code is valid for a short time. Do not share it with anyone.</p>
            <p style="font-size: 14px; color: #888; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `,
    });
    console.log(`Verification email sent to ${customerEmail}`);
  } catch (err) {
    console.error("Failed to send verification email:", err);
    throw new Error("Failed to send verification email.");
  }
};

// --- New function to send welcome email with premium styling
const sendWelcomeEmail = async ({ customerEmail, customerName }) => {
  console.log("Preparing to send welcome email to:", customerEmail);

  try {
    await resend.emails.send({
      from: "Nile Flow Africa <welcome@nileflowafrica.com>",
      to: customerEmail,
      subject: `🎉 Welcome to Nile Flow Africa, ${customerName}! | Your African Marketplace Journey Begins`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Nile Flow Africa | Premium African Marketplace</title>
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
                    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
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
                    background: linear-gradient(135deg, #ffffff 0%, #fef3c7 100%);
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
                    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .welcome-banner {
                    background: rgba(245, 158, 11, 0.1);
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    border-radius: 12px;
                    padding: 25px;
                    margin: 25px 0;
                    text-align: center;
                }
                
                .welcome-banner h3 {
                    font-size: 24px;
                    font-weight: 700;
                    color: #fbbf24;
                    margin: 0 0 15px 0;
                }
                
                .welcome-text {
                    font-size: 18px;
                    color: #cbd5e1;
                    margin-bottom: 30px;
                }
                
                .features-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin: 30px 0;
                }
                
                .feature-card {
                    background: rgba(30, 41, 59, 0.5);
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    border-radius: 16px;
                    padding: 20px;
                    text-align: center;
                }
                
                .feature-icon {
                    font-size: 32px;
                    margin-bottom: 10px;
                    display: block;
                }
                
                .feature-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #fbbf24;
                    margin-bottom: 8px;
                }
                
                .feature-desc {
                    font-size: 14px;
                    color: #94a3b8;
                    margin: 0;
                }
                
                .cta-button {
                    display: inline-block;
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                    text-decoration: none;
                    padding: 16px 32px;
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 16px;
                    text-align: center;
                    margin: 30px auto;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
                }
                
                .cta-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 25px rgba(245, 158, 11, 0.4);
                }
                
                .info-box {
                    background: rgba(30, 41, 59, 0.5);
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    border-radius: 16px;
                    padding: 20px;
                    margin: 30px 0;
                }
                
                .info-title {
                    color: #60a5fa;
                    font-weight: 600;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .info-text {
                    color: #cbd5e1;
                    margin: 0;
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
                    color: #fbbf24;
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
                    border-top: 1px solid rgba(245, 158, 11, 0.2);
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
                    color: #fbbf24;
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
                    
                    .features-grid {
                        grid-template-columns: 1fr;
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
                    <h1 class="logo">NILE FLOW AFRICA</h1>
                    <div class="logo-sub">PREMIUM AFRICAN MARKETPLACE</div>
                </div>
                
                <!-- Content -->
                <div class="content">
                    <h2 class="greeting">Welcome, ${customerName}! 🎉</h2>
                    
                    <div class="welcome-banner">
                        <h3>Your Journey to Authentic African Excellence Begins!</h3>
                        <p style="color: #cbd5e1; margin: 0;">Thank you for joining our community of discerning customers who appreciate premium African craftsmanship and culture.</p>
                    </div>
                    
                    <p class="welcome-text">
                        We're thrilled to have you as part of the Nile Flow Africa family! Your account has been successfully verified, and you now have access to our curated collection of premium African products.
                    </p>
                    
                    <!-- Features Grid -->
                    <div class="features-grid">
                        <div class="feature-card">
                            <span class="feature-icon">🏆</span>
                            <div class="feature-title">Premium Quality</div>
                            <p class="feature-desc">Handpicked authentic African products with guaranteed quality</p>
                        </div>
                        
                        <div class="feature-card">
                            <span class="feature-icon">🚚</span>
                            <div class="feature-title">Fast Delivery</div>
                            <p class="feature-desc">Quick and secure delivery across Kenya and beyond</p>
                        </div>
                        
                        <div class="feature-card">
                            <span class="feature-icon">🎁</span>
                            <div class="feature-title">Exclusive Deals</div>
                            <p class="feature-desc">Member-only discounts and early access to new arrivals</p>
                        </div>
                        
                        <div class="feature-card">
                            <span class="feature-icon">🌍</span>
                            <div class="feature-title">Cultural Heritage</div>
                            <p class="feature-desc">Celebrate and support African artisans and culture</p>
                        </div>
                    </div>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center;">
                        <a href="https://nileflowafrica.com/shop" class="cta-button">
                            🛍️ Start Shopping Now
                        </a>
                    </div>
                    
                    <!-- Getting Started Info -->
                    <div class="info-box">
                        <div class="info-title">🚀 Getting Started</div>
                        <p class="info-text">
                            Ready to explore? Browse our categories, add items to your cart, and experience the best of African craftsmanship. 
                            Don't forget to check out our featured collections and seasonal specials!
                        </p>
                    </div>
                    
                    <!-- Support Info -->
                    <div class="info-box">
                        <div class="info-title">💬 Need Assistance?</div>
                        <p class="info-text">
                            Our friendly support team is here to help! Reach out to us at 
                            <a href="mailto:support@nileflowafrica.com" style="color: #60a5fa; text-decoration: none;">support@nileflowafrica.com</a> 
                            or visit our help center for quick answers to common questions.
                        </p>
                    </div>
                    
                    <!-- Signature -->
                    <div class="signature">
                        <div class="team-name">The Nile Flow Team</div>
                        <div class="team-title">Celebrating African Excellence Together</div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="footer">
                    <div class="footer-links">
                        <a href="https://nileflowafrica.com" class="footer-link">Visit Our Store</a>
                        <a href="https://nileflowafrica.com/home" class="footer-link">Browse Categories</a>
                        <a href="https://nileflowafrica.com/about-us" class="footer-link">Our Story</a>
                        <a href="https://nileflowafrica.com/contact" class="footer-link">Contact Us</a>
                    </div>
                    
                    <div class="copyright">
                        © ${new Date().getFullYear()} Nile Flow Africa. All rights reserved.<br>
                        Nairobi, Kenya | Premium African Marketplace
                    </div>
                </div>
            </div>
        </body>
        </html>
      `,
    });
    console.log(`Welcome email sent successfully to ${customerEmail}`);
  } catch (err) {
    console.error("Welcome email sending failed:", err);
    throw err;
  }
};

const verifyCustomer = async (req, res) => {
  const { email, verificationCode, deviceId } = req.body;

  if (!email || !verificationCode) {
    return res
      .status(400)
      .json({ error: "Email and verification code are required." });
  }

  try {
    // Retrieve the stored verification code
    const storedCode = await getStoredVerificationCode(email);

    if (!storedCode || storedCode !== verificationCode) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification code." });
    }

    // Mark the user as verified
    await markUserAsVerified(email);

    // Invalidate the verification code
    await deleteVerificationCode(email);

    // ✅ AUTO-LOGIN: Fetch user and generate tokens
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Generate tokens (use your existing token generation functions)
    const accessToken = generateAuthTokens(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token with deviceId
    await storeRefreshToken(user.$id, refreshToken, deviceId);

    // Set httpOnly cookies
    /* res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    }); */

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      domain: "localhost",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      domain: "localhost",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    });

    // 🎉 Send welcome email after successful verification
    try {
      await sendWelcomeEmail({
        customerEmail: user.email,
        customerName: user.username || user.email.split("@")[0],
      });
      console.log("Welcome email sent successfully after verification");
    } catch (emailError) {
      console.error(
        "Failed to send welcome email, but verification was successful:",
        emailError,
      );
      // Don't fail the verification if welcome email fails
    }

    // Return success with user data
    return res.status(200).json({
      message: "Email verified and logged in successfully.",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        isVerified: true,
      },
    });
  } catch (error) {
    console.error("Verification error:", error);
    return res
      .status(500)
      .json({ error: "Verification failed. Please try again." });
  }
};

// POST /api/customerauth/verify
const verifyCustomerMobile = async (req, res) => {
  const { email, verificationCode } = req.body;

  if (!email || !verificationCode) {
    return res
      .status(400)
      .json({ error: "Email and verification code are required." });
  }

  try {
    const storedCode = await getStoredVerificationCode(email);

    if (!storedCode || storedCode !== verificationCode) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification code." });
    }

    // --- NEW LOGIC STARTS HERE ---
    // 1. Mark the user as verified
    await markUserAsVerified(email);

    // 2. Get the user from Appwrite to create a payload for the token
    const userList = await users.list([Query.equal("email", email)]);

    if (userList.users.length === 0) {
      throw new Error("User not found after verification.");
    }
    const user = userList.users[0];
    const userPrefs = await users.getPrefs(user.$id);

    const payload = {
      userId: user.$id,
      email: user.email,
      username: user.name,
      phone: userPrefs.phone, // Assuming phone is in prefs
      role: "customer", // or get it dynamically
    };

    // 3. Generate a new access token and refresh token
    const token = generateAuthTokens(payload);
    const refreshToken = generateRefreshToken(payload);

    // 4. Get the user's profile document
    const profileList = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      [Query.equal("email", email)],
    );
    const profile = profileList.documents[0] || null;

    // 5. Delete the used verification code
    await deleteVerificationCode(email);

    // 6. Return the tokens and user data to the front end
    return res.status(200).json({
      message: "Email verified successfully.",
      token,
      refreshToken,
      user: {
        id: user.$id,
        email: user.email,
        username: user.name,
        phone: userPrefs.phone,
        role: userPrefs.role,
        avatarUrl: userPrefs.avatar,
      },
      profile,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({
      error: error.message || "Verification failed due to an unexpected error.",
    });
  }
};

const storeVerificationCode = async (email, code) => {
  try {
    // First, check if a verification document already exists for this email
    const existingDocs = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_VERIFICATION_COLLECTION_ID,
      [Query.equal("email", email)],
    );

    if (existingDocs.documents.length > 0) {
      // If a document exists, update the existing one with the new code and time
      const documentId = existingDocs.documents[0].$id;
      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_VERIFICATION_COLLECTION_ID,
        documentId,
        { code, createdAt: new Date().toISOString() },
      );
      console.log("Updated existing verification code for:", email);
    } else {
      // If no document exists, create a new one
      await db.createDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_VERIFICATION_COLLECTION_ID,
        ID.unique(),
        {
          email,
          code,
          createdAt: new Date().toISOString(),
        },
      );
      console.log("Stored new verification code for:", email);
    }
  } catch (error) {
    console.error("Error storing verification code:", error);
    throw new Error("Failed to store verification code.");
  }
};

// Assumes you have a `db` instance from Appwrite
const getStoredVerificationCode = async (email) => {
  try {
    const response = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_VERIFICATION_COLLECTION_ID,
      [Query.equal("email", email)],
    );

    if (response.documents.length === 0) {
      return null; // No code found
    }

    const verificationDoc = response.documents[0];
    const createdAt = new Date(verificationDoc.createdAt);
    const now = new Date();
    const differenceInMinutes = (now - createdAt) / (1000 * 60);

    // Check if the code is older than, for example, 15 minutes
    if (differenceInMinutes > 15) {
      // Code has expired, delete it and return null
      await deleteVerificationCode(email);
      return null;
    }

    return verificationDoc.code;
  } catch (error) {
    console.error("Error getting stored verification code:", error);
    return null;
  }
};

const deleteVerificationCode = async (email) => {
  try {
    const response = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_VERIFICATION_COLLECTION_ID,
      [Query.equal("email", email)],
    );

    if (response.documents.length > 0) {
      const documentId = response.documents[0].$id;
      await db.deleteDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_VERIFICATION_COLLECTION_ID,
        documentId,
      );
      console.log("Deleted used verification code for:", email);
    }
  } catch (error) {
    console.error("Error deleting verification code:", error);
  }
};

const markUserAsVerified = async (email) => {
  try {
    // Step 1: Find the user in Appwrite's User's collection
    const userList = await users.list([Query.equal("email", email)]);

    if (userList.users.length === 0) {
      throw new Error("User not found.");
    }

    const userId = userList.users[0].$id;

    // Step 2: Update the user's preferences to mark as verified
    await users.updatePrefs(userId, { isVerified: true });
    console.log(`User ${userId} marked as verified.`);

    // Step 3: Find and update the user's profile document as well
    const profileList = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      [Query.equal("email", email)],
    );

    if (profileList.documents.length > 0) {
      const profileId = profileList.documents[0].$id;
      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_USER_COLLECTION_ID,
        profileId,
        { isVerified: true },
      );
      console.log(`User profile for ${email} updated as verified.`);
    }
  } catch (error) {
    console.error("Error marking user as verified:", error);
    throw new Error("Failed to update user verification status.");
  }
};

// POST /api/customerauth/resend-code
const resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ error: "Email is required to resend the code." });
  }

  try {
    // Step 1: Check if the user exists and is not already verified.
    // It's good practice to prevent spamming unverified users.
    const userList = await users.list([Query.equal("email", email)]);

    if (userList.users.length === 0) {
      // Do not reveal if the user exists for security reasons.
      // Return a success message to prevent user enumeration attacks.
      return res.status(200).json({
        message:
          "If an account with that email exists, a new verification code has been sent.",
      });
    }

    const user = userList.users[0];
    const userPrefs = await users.getPrefs(user.$id);

    if (!user.prefs || userPrefs.isVerified) {
      return res
        .status(400)
        .json({ error: "This account is already verified. Please log in." });
    }

    // Step 2: Generate a new code and store it in the database, overwriting the old one.
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    await storeVerificationCode(email, newCode);

    // Step 3: Send the new code via Resend.
    await sendVerificationEmail({
      customerEmail: email,
      customerName: user.username,
      verificationCode: newCode,
    });

    return res.status(200).json({
      message: "A new verification code has been sent to your email.",
    });
  } catch (error) {
    console.error("Resend code error:", error);
    return res
      .status(500)
      .json({ error: "Failed to resend the code. Please try again." });
  }
};

// --- New function to send the verification email END

/**
 * Send Order Cancellation Email
 */
const sendOrderCancellationEmail = async ({
  customerEmail,
  customerName,
  orderId,
  orderTotal,
  cart,
  cancellationReason,
}) => {
  console.log("Sending cancellation email to:", customerEmail);

  try {
    await resend.emails.send({
      from: "Nile Flow <no-reply@nileflowafrica.com>",
      to: customerEmail,
      subject: `❌ Order #${orderId} Cancelled | Nile Flow`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Cancelled</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #e2e8f0;">
            <div style="max-width: 650px; margin: 40px auto; background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(245, 158, 11, 0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #d69516 0%, #b35309 100%); padding: 40px 30px; text-align: center; border-bottom: 1px solid rgba(245, 158, 11, 0.3);">
                    <h1 style="margin: 0; color: #0f172a; font-size: 32px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">
                        🛍️ NILE FLOW
                    </h1>
                    <p style="margin: 10px 0 0; color: rgba(15, 23, 42, 0.8); font-size: 14px; font-weight: 500;">
                        Premium African Marketplace
                    </p>
                </div>

                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="display: inline-block; background: rgba(239, 68, 68, 0.1); border: 2px solid rgba(239, 68, 68, 0.3); border-radius: 16px; padding: 20px 30px;">
                            <h2 style="margin: 0; color: #ef4444; font-size: 24px; font-weight: 700;">
                                ❌ Order Cancelled
                            </h2>
                        </div>
                    </div>

                    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.8; margin: 20px 0;">
                        Hi <strong style="color: #fbbf24;">${customerName}</strong>,
                    </p>

                    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.8; margin: 20px 0;">
                        Your order <strong style="color: #fbbf24;">#${orderId}</strong> has been cancelled.
                    </p>

                    ${
                      cancellationReason
                        ? `
                    <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 15px 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #fca5a5; font-size: 14px;">
                            <strong>Reason:</strong> ${cancellationReason}
                        </p>
                    </div>
                    `
                        : ""
                    }

                    <!-- Order Details -->
                    <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 16px; padding: 25px; margin: 30px 0;">
                        <h3 style="margin: 0 0 20px; color: #fbbf24; font-size: 18px; font-weight: 600; border-bottom: 1px solid rgba(245, 158, 11, 0.2); padding-bottom: 15px;">
                            Order Summary
                        </h3>
                        
                        ${cart
                          .map(
                            (item) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
                                <div>
                                    <p style="margin: 0; color: #f8fafc; font-weight: 600; font-size: 15px;">${
                                      item.productName || item.name
                                    }</p>
                                    <p style="margin: 5px 0 0; color: #94a3b8; font-size: 14px;">Qty: ${
                                      item.quantity
                                    }</p>
                                </div>
                                <p style="margin: 0; color: #fbbf24; font-weight: 600; font-size: 16px;">Ksh ${(
                                  item.price * item.quantity
                                ).toFixed(2)}</p>
                            </div>
                        `,
                          )
                          .join("")}

                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 0 0; margin-top: 15px; border-top: 2px solid rgba(245, 158, 11, 0.3);">
                            <p style="margin: 0; color: #fbbf24; font-weight: 700; font-size: 18px;">TOTAL (Cancelled)</p>
                            <p style="margin: 0; color: #fbbf24; font-weight: 700; font-size: 22px;">Ksh ${parseFloat(
                              orderTotal,
                            ).toFixed(2)}</p>
                        </div>
                    </div>

                    <p style="color: #cbd5e1; font-size: 16px; line-height: 1.8; margin: 20px 0;">
                        If you didn't request this cancellation or have any questions, please contact our support team immediately.
                    </p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://nileflowafrica.com/shop" style="display: inline-block; background: linear-gradient(135deg, #d69516 0%, #b35309 100%); color: #0f172a; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 8px 20px rgba(214, 149, 22, 0.3); transition: all 0.3s ease;">
                            Continue Shopping
                        </a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background: rgba(15, 23, 42, 0.9); padding: 30px; text-align: center; border-top: 1px solid rgba(245, 158, 11, 0.2);">
                    <p style="margin: 0 0 15px; color: #94a3b8; font-size: 14px;">
                        Questions? Contact us at 
                        <a href="mailto:support@nileflowafrica.com" style="color: #fbbf24; text-decoration: none;">support@nileflowafrica.com</a>
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                        © 2024 Nile Flow. All rights reserved.
                    </p>
                </div>

            </div>
        </body>
        </html>
      `,
    });

    console.log("✅ Cancellation email sent successfully to:", customerEmail);
  } catch (error) {
    console.error("❌ Failed to send cancellation email:", error);
    throw error;
  }
};

/**
 * Send cancellation request confirmation email
 */
const sendCancellationRequestEmail = async ({
  customerEmail,
  customerName,
  orderId,
  reason,
}) => {
  console.log(
    "Preparing to send cancellation request email to:",
    customerEmail,
  );

  try {
    await resend.emails.send({
      from: "Nile Flow <no-reply@nileflowafrica.com>",
      to: customerEmail,
      subject: `📋 Cancellation Request Received - Order #${orderId} | Nile Flow`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cancellation Request Received</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
            
            <!-- Main Container -->
            <div style="max-width: 600px; margin: 40px auto; background: rgba(30, 41, 59, 0.95); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5); border: 1px solid rgba(245, 158, 11, 0.2);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        📋 Request Received
                    </h1>
                    <p style="margin: 10px 0 0; color: rgba(255,255,255,0.95); font-size: 16px;">
                        Order Cancellation Request
                    </p>
                </div>

                <!-- Content -->
                <div style="padding: 40px 30px;">
                    
                    <!-- Greeting -->
                    <p style="margin: 0 0 20px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                        Dear <strong style="color: #fbbf24;">${customerName}</strong>,
                    </p>

                    <!-- Main Message -->
                    <div style="background: rgba(15, 23, 42, 0.6); padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                        <p style="margin: 0 0 15px; color: #e2e8f0; font-size: 15px; line-height: 1.7;">
                            We have received your request to cancel order <strong style="color: #fbbf24;">#${orderId}</strong>.
                        </p>
                        <div style="background: rgba(245, 158, 11, 0.1); padding: 15px; border-radius: 8px; margin-top: 15px;">
                            <p style="margin: 0; color: #fbbf24; font-size: 14px;">
                                <strong>Reason:</strong> ${reason}
                            </p>
                        </div>
                    </div>

                    <!-- What Happens Next -->
                    <div style="margin-bottom: 30px;">
                        <h2 style="margin: 0 0 20px; color: #fbbf24; font-size: 20px; border-bottom: 2px solid rgba(245, 158, 11, 0.3); padding-bottom: 10px;">
                            ⏱️ What Happens Next
                        </h2>
                        
                        <div style="background: rgba(15, 23, 42, 0.4); padding: 20px; border-radius: 10px;">
                            <div style="margin-bottom: 15px;">
                                <p style="margin: 0 0 8px; color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                                    Step 1
                                </p>
                                <p style="margin: 0; color: #e2e8f0; font-size: 15px;">
                                    <strong style="color: #fbbf24;">Review Process:</strong> Our team will review your request within 24 hours
                                </p>
                            </div>

                            <div style="height: 1px; background: rgba(148, 163, 184, 0.2); margin: 15px 0;"></div>

                            <div style="margin-bottom: 15px;">
                                <p style="margin: 0 0 8px; color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                                    Step 2
                                </p>
                                <p style="margin: 0; color: #e2e8f0; font-size: 15px;">
                                    <strong style="color: #fbbf24;">Decision:</strong> You'll receive an email once your request is approved or if we need more information
                                </p>
                            </div>

                            <div style="height: 1px; background: rgba(148, 163, 184, 0.2); margin: 15px 0;"></div>

                            <div>
                                <p style="margin: 0 0 8px; color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                                    Step 3
                                </p>
                                <p style="margin: 0; color: #e2e8f0; font-size: 15px;">
                                    <strong style="color: #fbbf24;">Refund:</strong> If approved, payments will be refunded within 5-7 business days to your original payment method
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Order Details -->
                    <div style="background: rgba(15, 23, 42, 0.4); padding: 20px; border-radius: 10px; margin-bottom: 30px;">
                        <h3 style="margin: 0 0 15px; color: #fbbf24; font-size: 16px;">
                            📦 Order Reference
                        </h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Order ID:</td>
                                <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px; text-align: right; font-weight: bold;">#${orderId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Status:</td>
                                <td style="padding: 8px 0; color: #fbbf24; font-size: 14px; text-align: right; font-weight: bold;">Under Review</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Important Note -->
                    <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%); padding: 20px; border-radius: 10px; border: 1px solid rgba(245, 158, 11, 0.3); margin-bottom: 30px;">
                        <p style="margin: 0 0 10px; color: #fbbf24; font-size: 14px; font-weight: bold;">
                            📌 Important Note
                        </p>
                        <p style="margin: 0; color: #e2e8f0; font-size: 14px; line-height: 1.6;">
                            Please keep this email for your records. If your order has already been shipped, cancellation may not be possible. In that case, you can use our return policy once you receive the items.
                        </p>
                    </div>

                    <!-- Support -->
                    <div style="text-align: center; margin-top: 30px;">
                        <p style="margin: 0 0 15px; color: #94a3b8; font-size: 14px;">
                            Need help or have questions?
                        </p>
                        <a href="mailto:support@nileflowafrica.com" 
                           style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">
                            Contact Support
                        </a>
                    </div>

                    <!-- Thank You -->
                    <p style="margin: 30px 0 0; color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;">
                        Thank you for your patience.<br>
                        We'll get back to you as soon as possible.
                    </p>

                </div>

                <!-- Footer -->
                <div style="background: rgba(15, 23, 42, 0.9); padding: 30px; text-align: center; border-top: 1px solid rgba(245, 158, 11, 0.2);">
                    <p style="margin: 0 0 15px; color: #94a3b8; font-size: 14px;">
                        Questions? Contact us at 
                        <a href="mailto:support@nileflowafrica.com" style="color: #fbbf24; text-decoration: none;">support@nileflowafrica.com</a>
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                        © 2024 Nile Flow. All rights reserved.
                    </p>
                </div>

            </div>
        </body>
        </html>
      `,
    });

    console.log(
      "✅ Cancellation request email sent successfully to:",
      customerEmail,
    );
  } catch (error) {
    console.error("❌ Failed to send cancellation request email:", error);
    throw error;
  }
};

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  verifyCustomer,
  storeVerificationCode,
  markUserAsVerified,
  resendVerificationCode,
  verifyCustomerMobile,
  sendOrderCancellationEmail,
  sendCancellationRequestEmail,
};
