const crypto = require("crypto");
const { Query } = require("node-appwrite");
const { users, db } = require("../../src/appwrite");
const { env } = require("../../src/env");
const { Resend } = require("resend");

const resend = new Resend(env.RESEND_API_KEY);

/**
 * Send forgot password email
 */
const sendForgotPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user exists
    const userQuery = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      [Query.equal("email", email)],
    );

    if (userQuery.documents.length === 0) {
      // For security, we don't reveal if email exists or not
      return res.status(200).json({
        success: true,
        message:
          "If your email exists in our system, you will receive a password reset link shortly.",
      });
    }

    const user = userQuery.documents[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in user document
    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      user.$id,
      {
        resetToken,
        resetTokenExpiry: resetTokenExpiry.toISOString(),
      },
    );

    // Create reset URL
    const resetUrl = `${env.FRONTEND_URL_PROD}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Nile Flow Africa <no-reply@nileflowafrica.com>",
      to: email,
      subject: "🔐 Reset Your Nile Flow Africa Password",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password | Nile Flow Africa</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0;
                    padding: 0;
                    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                    color: #ffffff;
                    line-height: 1.6;
                }
                
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding: 30px 0;
                    background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
                    border-radius: 16px;
                }
                
                .logo {
                    font-size: 32px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 8px;
                }
                
                .tagline {
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 14px;
                    font-weight: 500;
                }
                
                .content {
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(217, 119, 6, 0.2);
                    border-radius: 16px;
                    padding: 40px 30px;
                    margin-bottom: 30px;
                }
                
                .greeting {
                    font-size: 24px;
                    font-weight: 600;
                    color: #f59e0b;
                    margin-bottom: 20px;
                }
                
                .message {
                    color: rgba(255, 255, 255, 0.9);
                    margin-bottom: 30px;
                    font-size: 16px;
                }
                
                .cta-button {
                    display: inline-block;
                    background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
                    color: white;
                    padding: 16px 32px;
                    text-decoration: none;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 16px;
                    margin: 20px 0;
                    box-shadow: 0 8px 25px rgba(217, 119, 6, 0.3);
                    transition: all 0.3s ease;
                }
                
                .cta-button:hover {
                    background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 12px 35px rgba(217, 119, 6, 0.4);
                }
                
                .security-note {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    border-radius: 12px;
                    padding: 20px;
                    margin: 30px 0;
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 14px;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 30px;
                    border-top: 1px solid rgba(217, 119, 6, 0.2);
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 14px;
                }
                
                .footer-links {
                    margin-top: 20px;
                }
                
                .footer-links a {
                    color: #f59e0b;
                    text-decoration: none;
                    margin: 0 15px;
                }
                
                .footer-links a:hover {
                    color: #fbbf24;
                    text-decoration: underline;
                }
                
                @media (max-width: 600px) {
                    .container {
                        padding: 20px 10px;
                    }
                    
                    .content {
                        padding: 30px 20px;
                    }
                    
                    .cta-button {
                        display: block;
                        text-align: center;
                        margin: 20px 0;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🌊 Nile Flow Africa</div>
                    <div class="tagline">Premium African Marketplace</div>
                </div>
                
                <div class="content">
                    <div class="greeting">Hello ${user.username || "there"},</div>
                    
                    <div class="message">
                        We received a request to reset the password for your Nile Flow account. 
                        If you made this request, click the button below to create a new password.
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${resetUrl}" class="cta-button">
                            🔐 Reset My Password
                        </a>
                    </div>
                    
                    <div class="message">
                        This link will expire in 1 hour for your security. If you don't reset your 
                        password within this time, you'll need to request a new reset link.
                    </div>
                    
                    <div class="security-note">
                        <strong>🛡️ Security Notice:</strong><br>
                        If you didn't request this password reset, please ignore this email. 
                        Your account is still secure and no changes have been made.
                    </div>
                </div>
                
                <div class="footer">
                    <div>
                        This email was sent to ${email}<br>
                        © 2026 Nile Flow Africa. All rights reserved.
                    </div>
                    
                    <div class="footer-links">
                        <a href="${env.FRONTEND_URL}/privacy">Privacy Policy</a>
                        <a href="${env.FRONTEND_URL}/terms">Terms of Service</a>
                        <a href="${env.FRONTEND_URL}/contact">Contact Support</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
      `,
    });

    console.log(
      "✅ Password reset email sent successfully:",
      emailResponse.data?.id,
    );

    res.status(200).json({
      success: true,
      message:
        "If your email exists in our system, you will receive a password reset link shortly.",
    });
  } catch (error) {
    console.error("❌ Error sending forgot password email:", error);
    res.status(500).json({
      success: false,
      message:
        "Unable to process password reset request. Please try again later.",
    });
  }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, token, and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Find user by email
    const userQuery = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      [Query.equal("email", email)],
    );

    if (userQuery.documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    const user = userQuery.documents[0];

    // Check if token matches and is not expired
    if (user.resetToken !== token) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    if (
      !user.resetTokenExpiry ||
      new Date(user.resetTokenExpiry) < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Reset token has expired",
      });
    }

    // Update password using Appwrite
    await users.updatePassword(user.appwriteUserId, newPassword);

    // Clear reset token from user document
    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      user.$id,
      {
        resetToken: null,
        resetTokenExpiry: null,
      },
    );

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    res.status(500).json({
      success: false,
      message: "Unable to reset password. Please try again later.",
    });
  }
};

module.exports = {
  sendForgotPasswordEmail,
  resetPassword,
};
