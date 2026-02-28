const { Resend } = require("resend");
const { env } = require("../src/env");

const resend = new Resend(env.RESEND_API_KEY);

/**
 * Send Welcome Email — Strategic Positioning
 * Introduces vendor to Nile Flow's vision and platform positioning
 */
const sendVendorWelcomeEmail = async ({ vendorName, vendorEmail }) => {
  try {
    await resend.emails.send({
      from: "Nile Flow  Africa <onboarding@nileflowafrica.com>",
      to: vendorEmail,
      subject: "Welcome to Nile Flow — Let's Build Something Generational",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Nile Flow Africa</title>
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
                }
                
                .logo {
                    font-size: 32px;
                    font-weight: 800;
                    margin: 0;
                    color: #ffffff;
                }
                
                .content {
                    padding: 40px 30px;
                }
                
                .greeting {
                    font-size: 24px;
                    font-weight: 700;
                    color: #fbbf24;
                    margin: 0 0 20px 0;
                }
                
                .section {
                    margin: 25px 0;
                    padding: 20px;
                    background: rgba(30, 41, 59, 0.5);
                    border-left: 4px solid #f59e0b;
                    border-radius: 8px;
                }
                
                .section-title {
                    font-weight: 700;
                    color: #fbbf24;
                    margin: 0 0 10px 0;
                    font-size: 16px;
                }
                
                .section-content {
                    color: #cbd5e1;
                    margin: 0;
                    font-size: 14px;
                    line-height: 1.8;
                }
                
                ul {
                    margin: 10px 0;
                    padding-left: 20px;
                    color: #cbd5e1;
                }
                
                li {
                    margin: 8px 0;
                }
                
                .highlight {
                    color: #10b981;
                    font-weight: 600;
                }
                
                .signature {
                    margin-top: 40px;
                    padding-top: 30px;
                    border-top: 1px solid rgba(148, 163, 184, 0.1);
                    text-align: center;
                }
                
                .signature-name {
                    font-weight: 700;
                    color: #fbbf24;
                    font-size: 16px;
                    margin: 10px 0 5px 0;
                }
                
                .signature-title {
                    color: #94a3b8;
                    font-size: 13px;
                }
                
                .footer {
                    background: rgba(15, 23, 42, 0.9);
                    padding: 25px;
                    text-align: center;
                    border-top: 1px solid rgba(245, 158, 11, 0.2);
                    font-size: 12px;
                    color: #64748b;
                }
                
                @media (max-width: 600px) {
                    .content {
                        padding: 25px 20px;
                    }
                    .greeting {
                        font-size: 20px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="logo">NILE FLOW</h1>
                </div>
                
                <div class="content">
                    <h2 class="greeting">Welcome, ${vendorName} 👋</h2>
                    
                    <p style="color: #cbd5e1; margin-bottom: 30px;">
                        We're excited to officially onboard you to a platform built for more than transactions — we are building a hyperlocal, AI-powered commerce ecosystem designed to elevate African businesses and unlock economic participation at scale.
                    </p>
                    
                    <div class="section">
                        <div class="section-title">Why Nile Flow Africa?</div>
                        <div class="section-content">
                            <ul>
                                <li><span class="highlight">Increase your product visibility</span> with AI-powered discovery</li>
                                <li><span class="highlight">Expand your customer reach</span> across African markets</li>
                                <li><span class="highlight">Structured order management</span> that scales with your business</li>
                                <li><span class="highlight">Integrated digital payments</span> for seamless transactions</li>
                                <li><span class="highlight">Nile Miles loyalty system</span> to drive repeat purchases</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">What's Next?</div>
                        <div class="section-content">
                            Over the coming days, we will guide you through:
                            <ul>
                                <li>Completing your store profile</li>
                                <li>Uploading optimized product listings</li>
                                <li>Managing orders efficiently</li>
                                <li>Understanding commission structure and payout cycles</li>
                            </ul>
                        </div>
                    </div>
                    
                    <p style="color: #cbd5e1; font-style: italic; margin: 30px 0;">
                        This is not just another eCommerce listing platform. It is infrastructure for growth.
                    </p>
                    
                    <div class="signature">
                        <div class="section-content">
                            Your success on Nile Flow  Africa is directly linked to presentation quality, responsiveness, and customer experience. We are here to support you — but execution matters.
                        </div>
                        <div class="signature-name">Let's build something generational.</div>
                        <div class="signature-name" style="margin-top: 20px;">Anthony</div>
                        <div class="signature-title">Founder, Nile Flow Africa</div>
                        <div class="signature-title">Nile Flow Store Ltd</div>
                    </div>
                </div>
                
                <div class="footer">
                    © ${new Date().getFullYear()} Nile Flow. All rights reserved.<br>
                    Nairobi, Kenya | Premium African Marketplace
                </div>
            </div>
        </body>
        </html>
      `,
    });
    console.log(`✅ Welcome email sent to ${vendorEmail}`);
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    throw error;
  }
};

/**
 * Send Vendor Dashboard Activation Email — Operational Clarity
 * Provides action items and setup instructions
 */
const sendVendorDashboardActivationEmail = async ({
  vendorName,
  vendorEmail,
}) => {
  try {
    await resend.emails.send({
      from: "Nile Flow Africa <onboarding@nileflowafrica.com>",
      to: vendorEmail,
      subject:
        "Your Nile Flow Africa Dashboard is Live — Complete These Steps Now",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dashboard Activation</title>
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
                }
                
                .logo {
                    font-size: 32px;
                    font-weight: 800;
                    margin: 0;
                    color: #ffffff;
                }
                
                .content {
                    padding: 40px 30px;
                }
                
                .greeting {
                    font-size: 24px;
                    font-weight: 700;
                    color: #fbbf24;
                    margin: 0 0 20px 0;
                }
                
                .checklist {
                    background: rgba(30, 41, 59, 0.5);
                    border: 1px solid rgba(245, 158, 11, 0.2);
                    border-radius: 12px;
                    padding: 25px;
                    margin: 30px 0;
                }
                
                .checklist-title {
                    font-weight: 700;
                    color: #fbbf24;
                    margin: 0 0 20px 0;
                    font-size: 18px;
                }
                
                .checklist-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    margin: 15px 0;
                    padding: 12px;
                    background: rgba(15, 23, 42, 0.5);
                    border-radius: 8px;
                }
                
                .checklist-number {
                    background: #f59e0b;
                    color: #000;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    flex-shrink: 0;
                }
                
                .checklist-text {
                    color: #cbd5e1;
                    font-size: 14px;
                    line-height: 1.6;
                    margin: 0;
                }
                
                .warning-box {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-left: 4px solid #ef4444;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 25px 0;
                }
                
                .warning-title {
                    color: #fca5a5;
                    font-weight: 700;
                    margin: 0 0 10px 0;
                }
                
                .warning-text {
                    color: #cbd5e1;
                    font-size: 14px;
                    margin: 0;
                }
                
                .info-box {
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-left: 4px solid #3b82f6;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 25px 0;
                }
                
                .info-text {
                    color: #cbd5e1;
                    font-size: 14px;
                    margin: 0;
                }
                
                .signature {
                    margin-top: 40px;
                    padding-top: 30px;
                    border-top: 1px solid rgba(148, 163, 184, 0.1);
                    text-align: center;
                }
                
                .signature-name {
                    font-weight: 700;
                    color: #fbbf24;
                    font-size: 16px;
                    margin: 10px 0 5px 0;
                }
                
                .signature-title {
                    color: #94a3b8;
                    font-size: 13px;
                }
                
                .footer {
                    background: rgba(15, 23, 42, 0.9);
                    padding: 25px;
                    text-align: center;
                    border-top: 1px solid rgba(245, 158, 11, 0.2);
                    font-size: 12px;
                    color: #64748b;
                }
                
                @media (max-width: 600px) {
                    .content {
                        padding: 25px 20px;
                    }
                    .greeting {
                        font-size: 20px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="logo">NILE FLOW AFRICA</h1>
                </div>
                
                <div class="content">
                    <h2 class="greeting">Your Dashboard is Live! 🚀</h2>
                    
                    <p style="color: #cbd5e1; margin-bottom: 30px;">
                        Now that you're onboarded, let's get your store up and running. To maximize your visibility and sales potential, please complete the following setup within the next 48 hours:
                    </p>
                    
                    <div class="checklist">
                        <div class="checklist-title">Setup Checklist</div>
                        
                        <div class="checklist-item">
                            <div class="checklist-number">1</div>
                            <div class="checklist-text">Upload a high-resolution store logo</div>
                        </div>
                        
                        <div class="checklist-item">
                            <div class="checklist-number">2</div>
                            <div class="checklist-text">Add a compelling store description (who you are, what makes you different)</div>
                        </div>
                        
                        <div class="checklist-item">
                            <div class="checklist-number">3</div>
                            <div class="checklist-text">List at least 5 products with clear pricing and accurate stock levels</div>
                        </div>
                        
                        <div class="checklist-item">
                            <div class="checklist-number">4</div>
                            <div class="checklist-text">Upload professional product images for each item</div>
                        </div>
                        
                        <div class="checklist-item">
                            <div class="checklist-number">5</div>
                            <div class="checklist-text">Confirm your payout details (bank/mobile money)</div>
                        </div>
                    </div>
                    
                    <div class="warning-box">
                        <div class="warning-title">⚠️ Quality Matters</div>
                        <div class="warning-text">
                            Product quality and accurate pricing directly affect ranking and visibility on the platform. We are building a high-performance marketplace. Vendors who treat this seriously will see growth. Vendors who don't will get buried by the algorithm.
                        </div>
                    </div>
                    
                    <div class="info-box">
                        <div class="info-text">
                            Need help? Reply to this email and our support team will guide you through the onboarding process.
                        </div>
                    </div>
                    
                    <div class="signature">
                        <div style="color: #cbd5e1; font-size: 14px; margin-bottom: 20px;">
                            Let's execute.
                        </div>
                        <div class="signature-name">Best,</div>
                        <div class="signature-name">Anthony Wai</div>
                        <div class="signature-title">Founder, Nile Flow Africa</div>
                        <div class="signature-title">Nile Flow Store Ltd</div>
                    </div>
                </div>
                
                <div class="footer">
                    © ${new Date().getFullYear()} Nile Flow. All rights reserved.<br>
                    Nairobi, Kenya | Premium African Marketplace
                </div>
            </div>
        </body>
        </html>
      `,
    });
    console.log(`✅ Dashboard activation email sent to ${vendorEmail}`);
  } catch (error) {
    console.error("Failed to send dashboard activation email:", error);
    throw error;
  }
};

/**
 * Send Growth & Performance Email — Setting Expectations
 * Outlines success strategies and platform advantages
 */
const sendVendorGrowthEmail = async ({ vendorName, vendorEmail }) => {
  try {
    await resend.emails.send({
      from: "Nile Flow Africa <onboarding@nileflowafrica.com>",
      to: vendorEmail,
      subject: "How to Win on Nile Flow Africa — Performance Strategies",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Growth & Performance Guide</title>
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
                }
                
                .logo {
                    font-size: 32px;
                    font-weight: 800;
                    margin: 0;
                    color: #ffffff;
                }
                
                .content {
                    padding: 40px 30px;
                }
                
                .greeting {
                    font-size: 24px;
                    font-weight: 700;
                    color: #fbbf24;
                    margin: 0 0 20px 0;
                }
                
                .principle-card {
                    background: rgba(30, 41, 59, 0.5);
                    border: 1px solid rgba(245, 158, 11, 0.2);
                    border-radius: 12px;
                    padding: 20px;
                    margin: 20px 0;
                }
                
                .principle-number {
                    display: inline-block;
                    background: #f59e0b;
                    color: #000;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    text-align: center;
                    line-height: 32px;
                    font-weight: 700;
                    margin-bottom: 10px;
                }
                
                .principle-title {
                    color: #fbbf24;
                    font-weight: 700;
                    font-size: 18px;
                    margin: 0 0 8px 0;
                }
                
                .principle-text {
                    color: #cbd5e1;
                    font-size: 14px;
                    margin: 0;
                    line-height: 1.6;
                }
                
                .strategy-box {
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-left: 4px solid #3b82f6;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 25px 0;
                }
                
                .strategy-title {
                    color: #60a5fa;
                    font-weight: 700;
                    margin: 0 0 15px 0;
                    font-size: 16px;
                }
                
                .strategy-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .strategy-list li {
                    color: #cbd5e1;
                    font-size: 14px;
                    margin: 10px 0;
                    padding-left: 20px;
                    position: relative;
                }
                
                .strategy-list li:before {
                    content: "✓";
                    position: absolute;
                    left: 0;
                    color: #10b981;
                    font-weight: 700;
                }
                
                .highlight {
                    color: #fbbf24;
                    font-weight: 700;
                }
                
                .future-box {
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-left: 4px solid #10b981;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 25px 0;
                }
                
                .future-text {
                    color: #cbd5e1;
                    font-size: 14px;
                    margin: 0;
                    line-height: 1.6;
                }
                
                .signature {
                    margin-top: 40px;
                    padding-top: 30px;
                    border-top: 1px solid rgba(148, 163, 184, 0.1);
                    text-align: center;
                }
                
                .signature-tagline {
                    color: #fbbf24;
                    font-weight: 700;
                    font-size: 16px;
                    font-style: italic;
                    margin: 0 0 20px 0;
                }
                
                .signature-name {
                    font-weight: 700;
                    color: #fbbf24;
                    font-size: 16px;
                    margin: 10px 0 5px 0;
                }
                
                .signature-title {
                    color: #94a3b8;
                    font-size: 13px;
                }
                
                .footer {
                    background: rgba(15, 23, 42, 0.9);
                    padding: 25px;
                    text-align: center;
                    border-top: 1px solid rgba(245, 158, 11, 0.2);
                    font-size: 12px;
                    color: #64748b;
                }
                
                @media (max-width: 600px) {
                    .content {
                        padding: 25px 20px;
                    }
                    .greeting {
                        font-size: 20px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="logo">NILE FLOW AFRICA</h1>
                </div>
                
                <div class="content">
                    <h2 class="greeting">Ready to Scale Your Store? 📈</h2>
                    
                    <p style="color: #cbd5e1; margin-bottom: 30px;">
                        Now that you're onboarded, let's focus on performance. The vendors who scale on Nile Flow understand these three core principles:
                    </p>
                    
                    <div class="principle-card">
                        <div class="principle-number">1</div>
                        <div class="principle-title">Visibility Drives Revenue</div>
                        <div class="principle-text">
                            Our AI-powered discovery system prioritizes high-quality products with complete information, professional images, and detailed descriptions. Make sure your store stands out.
                        </div>
                    </div>
                    
                    <div class="principle-card">
                        <div class="principle-number">2</div>
                        <div class="principle-title">Trust Drives Repeat Purchases</div>
                        <div class="principle-text">
                            Customer reviews, fast fulfillment, and responsive communication build trust. Treat each customer like your first customer.
                        </div>
                    </div>
                    
                    <div class="principle-card">
                        <div class="principle-number">3</div>
                        <div class="principle-title">Speed Drives Rankings</div>
                        <div class="principle-text">
                            Our algorithm rewards vendors who fulfill orders quickly and maintain consistent stock levels. Active, responsive vendors rank higher.
                        </div>
                    </div>
                    
                    <div class="strategy-box">
                        <div class="strategy-title">🎯 Your Winning Formula</div>
                        <ul class="strategy-list">
                            <li>Upload complete, detailed product descriptions</li>
                            <li>Keep pricing competitive and transparent</li>
                            <li>Fulfill orders within agreed timelines</li>
                            <li>Encourage customers to leave reviews</li>
                            <li>Maintain real-time stock accuracy</li>
                            <li>Respond to customer inquiries quickly</li>
                        </ul>
                    </div>
                    
                    <div class="future-box">
                        <div class="future-text">
                            <span class="highlight">Coming Soon:</span> Nile Flow Africa will introduce deeper AI-driven product discovery and personalized recommendations. Vendors with strong engagement metrics will benefit most from this distribution advantage. Your growth is data-driven.
                        </div>
                    </div>
                    
                    <p style="color: #cbd5e1; font-size: 14px; margin: 30px 0;">
                        We will periodically share performance insights to help you optimize conversion rates and increase sales volume. We are building infrastructure that supports serious businesses. Let's make your store one of the top performers.
                    </p>
                    
                    <div class="signature">
                        <div class="signature-tagline">Forward. Always forward.</div>
                        <div class="signature-name">Regards,</div>
                        <div class="signature-name">Anthony Wai</div>
                        <div class="signature-title">Founder, Nile Flow Africa</div>
                        <div class="signature-title">Nile Flow Store Ltd</div>
                    </div>
                </div>
                
                <div class="footer">
                    © ${new Date().getFullYear()} Nile Flow. All rights reserved.<br>
                    Nairobi, Kenya | Premium African Marketplace
                </div>
            </div>
        </body>
        </html>
      `,
    });
    console.log(`✅ Growth & performance email sent to ${vendorEmail}`);
  } catch (error) {
    console.error("Failed to send growth email:", error);
    throw error;
  }
};

/**
 * Send all three onboarding emails to vendor
 */
const sendVendorOnboardingEmails = async ({ vendorName, vendorEmail }) => {
  try {
    // Send emails with staggered timing for better deliverability
    await sendVendorWelcomeEmail({ vendorName, vendorEmail });

    // Wait 2 seconds before sending next email
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await sendVendorDashboardActivationEmail({ vendorName, vendorEmail });

    // Wait 2 seconds before sending next email
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await sendVendorGrowthEmail({ vendorName, vendorEmail });

    console.log(`✅ All onboarding emails sent successfully to ${vendorEmail}`);
    return {
      success: true,
      message: "All onboarding emails sent successfully",
    };
  } catch (error) {
    console.error("Error sending vendor onboarding emails:", error);
    throw error;
  }
};

module.exports = {
  sendVendorWelcomeEmail,
  sendVendorDashboardActivationEmail,
  sendVendorGrowthEmail,
  sendVendorOnboardingEmails,
};
