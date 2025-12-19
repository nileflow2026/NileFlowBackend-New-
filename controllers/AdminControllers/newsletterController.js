const { ID, Query } = require("node-appwrite");
const { db } = require("../../services/appwriteService");
const { env } = require("../../src/env");
const { Resend } = require("resend");
const resend = new Resend(env.RESEND_API_KEY);
const renderNewsletter = require("../emails/newsletterRenderer");

const newsletter = async (req, res) => {
  try {
    const { email, username } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    // Check if the email already exists in the newsletter list
    const { documents } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NEWSLETTER_COLLECTION_ID,
      [Query.equal("email", email)]
    );

    if (documents.length > 0) {
      return res.status(409).json({ error: "You are already subscribed." });
    }

    // Create a new document in the subscribers collection
    await db.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NEWSLETTER_COLLECTION_ID,
      ID.unique(),
      { email: email, name: username, subscribed: true } // Save the name provided from the frontend
    );

    res.status(200).json({ message: "Thank you for subscribing!" });
  } catch (error) {
    console.error("Subscription error:", error);
    res
      .status(500)
      .json({ error: "Failed to subscribe. Please try again later." });
  }
};

// A new function to send the newsletter email
const sendNewsletterEmail = async ({ toEmail, subject, htmlContent }) => {
  try {
    await resend.emails.send({
      from: "Nile Flow <updates@nileflowafrica.com>", // Use a different 'from' email for newsletters
      to: toEmail,
      subject: subject,
      html: htmlContent,
    });
    console.log(`Newsletter sent to: ${toEmail}`);
  } catch (err) {
    console.error(`Failed to send newsletter email to ${toEmail}:`, err);
  }
};

const sendnewsletters = async (req, res) => {
  try {
    const { subject } = req.body;

    if (!subject) {
      return res.status(400).json({ error: "Subject is required." });
    }

    // --- NEW: Fetch products to feature in the newsletter ---
    const { documents: featuredProducts } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID, // Use your actual database ID
      env.APPWRITE_PRODUCT_COLLECTION_ID, // Use your products collection ID
      [Query.orderDesc("$createdAt"), Query.limit(4)] // Get the 4 newest products
    );

    if (featuredProducts.length === 0) {
      // You can still send a newsletter without products if you wish
      // but this example returns an error.
      return res.status(404).json({ message: "No featured products found." });
    }

    // --- NEW: Generate HTML for the product cards ---
    const productCardsHtml = featuredProducts
      .map(
        (product) => `
      <div class="product-card">
          <img src="${product.image}" alt="${product.productName}"> 
          <h3>${product.productName}</h3>
          <p>KES${product.price.toFixed(2)}</p>
          <a href="https://nileflowafrica.com/featured-products/${
            product.productId
          }" style="display: inline-block; background-color: #e47d2b; color: #fff; padding: 8px 12px; text-decoration: none; border-radius: 5px; margin-top: 10px; font-weight: bold; font-size: 14px;">View Product</a>
      </div>
    `
      )
      .join("");

    const currentYear = new Date().getFullYear();

    // --- NEW: Construct the complete HTML template ---
    // This is a simple template. For a real app, use a dedicated email template library or a more robust HTML file.
    const finalHtmlContent = `
      <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Arrivals at Nile Flow!${subject}</title>
            <style>
                body { font-family: 'Arial', sans-serif; background-color: #f4f4ff; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); overflow: hidden; }
                .header { background-color: #1a202c; color: #fff; padding: 20px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; }
                .content { padding: 30px; }
                .product-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
                .product-card { background-color: #f9f9f9; border-radius: 8px; overflow: hidden; text-align: center; padding: 10px; border: 1px solid #eee; }
                .product-card img { width: 100%; height: auto; border-radius: 6px; }
                .product-card h3 { font-size: 18px; margin: 10px 0 5px; color: #333; }
                .product-card p { font-size: 16px; color: #000; font-weight: bold; margin: 0; }
                .cta-button { display: inline-block; background-color: #e47d2b; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; font-weight: bold; }
                .footer { background-color: #1a202c; color: #999; text-align: center; padding: 20px; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛍️ ${subject}</h1>
                </div>
                <div class="content">
                    <h2 style="font-size: 24px; color: #333; margin-top: 0;">Hi {{customer_name}},</h2>
                    <p style="font-size: 16px; color: #555;">Discover our latest and greatest products, handpicked just for you.</p>

                    <div class="product-grid">
                        ${productCardsHtml}
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://nileflowafrica.com/shop" class="cta-button">Shop All New Products</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; ${currentYear} Nile Flow. All rights reserved.</p>
                    <p>You are receiving this email because you subscribed to our newsletter.</p>
                    <p><a href="{{unsubscribe_link}}" style="color: #999;">Unsubscribe</a></p>
                </div>
            </div>
        </body>
        </html>
    `;

    // Fetch all documents (subscribers) from your newsletter collection
    const { documents: subscribers } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NEWSLETTER_COLLECTION_ID,
      [Query.equal("subscribed", true)]
    );

    if (subscribers.length === 0) {
      return res.status(404).json({ message: "No subscribers found." });
    }

    const emailPromises = subscribers.map((subscriber) => {
      const personalizedHtml = finalHtmlContent
        .replace("{{customer_name}}", subscriber.name?.trim() || "there")
        .replace(
          "{{unsubscribe_link}}",
          `https://nileflowafrica.com/unsubscribe?email=${encodeURIComponent(
            subscriber.email
          )}`
        );

      return sendNewsletterEmail({
        toEmail: subscriber.email,
        subject,
        htmlContent: personalizedHtml,
      });
    });

    await Promise.allSettled(emailPromises);

    res.status(200).json({ message: "Newsletter sent successfully!" });
  } catch (error) {
    console.error("API call failed:", error);
    res.status(500).json({ error: "Failed to send newsletter." });
  }
};

const unsubscribe = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).send("Invalid unsubscribe request.");
    }

    const { documents } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NEWSLETTER_COLLECTION_ID,
      [Query.equal("email", email)]
    );

    if (documents.length === 0) {
      return res.status(404).send("Email not found.");
    }

    await db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NEWSLETTER_COLLECTION_ID,
      documents[0].$id,
      { subscribed: false }
    );

    res.send("You’ve been unsubscribed successfully.");
  } catch (error) {
    console.error("Unsubscribe error:", error);
    res.status(500).send("Failed to unsubscribe.");
  }
};

const sendnewsletter = async (req, res) => {
  try {
    const {
      subject,
      campaignType,
      targetAudience,
      scheduledAt, // not used yet, but accepted
      message,
      bannerUrl,
      ctaText,
      ctaLink,
    } = req.body;

    if (!subject || !campaignType) {
      return res.status(400).json({
        error: "Subject and campaign type are required.",
      });
    }

    /**
     * ----------------------------
     * 1️⃣ Resolve campaign data
     * ----------------------------
     */
    let campaignData = { subject };

    if (campaignType === "products") {
      const { documents: products } = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        [Query.orderDesc("$createdAt"), Query.limit(4)]
      );

      if (!products.length) {
        return res.status(404).json({ error: "No products found." });
      }

      campaignData.products = products;
    }

    if (campaignType === "announcement") {
      if (!message) {
        return res
          .status(400)
          .json({ error: "Message is required for announcements." });
      }
      campaignData.message = message;
    }

    if (campaignType === "promotion") {
      if (!bannerUrl || !ctaText || !ctaLink) {
        return res.status(400).json({
          error: "Promotion campaigns require bannerUrl, ctaText, and ctaLink.",
        });
      }

      campaignData.bannerUrl = bannerUrl;
      campaignData.ctaText = ctaText;
      campaignData.ctaLink = ctaLink;
    }

    /**
     * ----------------------------
     * 2️⃣ Render base HTML
     * ----------------------------
     */
    const baseHtml = renderNewsletter({
      campaignType,
      data: campaignData,
    });

    /**
     * ----------------------------
     * 3️⃣ Resolve audience
     * ----------------------------
     */
    const audienceQueries = [Query.equal("subscribed", true)];

    if (targetAudience === "vip") {
      audienceQueries.push(Query.equal("isVIP", true));
    }

    const { documents: subscribers } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NEWSLETTER_COLLECTION_ID,
      audienceQueries
    );

    if (!subscribers.length) {
      return res.status(404).json({ error: "No subscribers found." });
    }

    /**
     * ----------------------------
     * 4️⃣ Send personalized emails
     * ----------------------------
     */
    const emailJobs = subscribers.map((subscriber) => {
      const personalizedHtml = baseHtml
        .replace("{{customer_name}}", subscriber.name?.trim() || "there")
        .replace(
          "{{unsubscribe_link}}",
          `https://nileflowafrica.com/unsubscribe?email=${encodeURIComponent(
            subscriber.email
          )}`
        );

      return sendNewsletterEmail({
        toEmail: subscriber.email,
        subject,
        htmlContent: personalizedHtml,
      });
    });

    await Promise.allSettled(emailJobs);

    /**
     * ----------------------------
     * 5️⃣ Response
     * ----------------------------
     */
    res.status(200).json({
      message: "Campaign sent successfully.",
      sent: subscribers.length,
      campaignType,
    });
  } catch (error) {
    console.error("Newsletter error:", error);
    res.status(500).json({
      error: "Failed to send newsletter campaign.",
    });
  }
};

module.exports = {
  newsletter,
  sendnewsletter,
};
