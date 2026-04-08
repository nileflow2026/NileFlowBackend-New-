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

// Fallback HTML template generator
const generateFallbackTemplate = (campaignData, campaignType) => {
  const {
    subject,
    products = [],
    message = "",
    bannerUrl = "",
    ctaText = "",
    ctaLink = "",
  } = campaignData;

  let contentSection = "";

  if (campaignType === "marketing" && products.length > 0) {
    const productItems = products
      .slice(0, 3)
      .map(
        (product) => `
      <div style="border: 1px solid #E8D6B5; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #FFFFFF;">
        <h3 style="color: #8B4513; margin: 0 0 8px 0; font-size: 18px;">${
          product.name || "Featured Product"
        }</h3>
        <p style="color: #666; margin: 0 0 12px 0; font-size: 14px;">${
          product.description || "Discover amazing products in our marketplace."
        }</p>
        <div style="color: #D4A017; font-weight: bold; font-size: 16px;">$${
          product.price || "Contact for pricing"
        }</div>
      </div>
    `
      )
      .join("");

    contentSection = `
      <div style="margin-bottom: 32px;">
        <h2 style="color: #8B4513; margin-bottom: 20px; font-size: 24px;">Featured Products</h2>
        ${productItems}
      </div>
    `;
  } else if (campaignType === "announcement" && message) {
    contentSection = `
      <div style="background: #FAF7F2; padding: 24px; border-radius: 8px; border-left: 4px solid #D4A017; margin-bottom: 32px;">
        <h2 style="color: #8B4513; margin: 0 0 16px 0; font-size: 24px;">Important Announcement</h2>
        <p style="color: #2C1810; margin: 0; line-height: 1.6; font-size: 16px;">${message}</p>
      </div>
    `;
  } else if (campaignType === "educational") {
    contentSection = `
      <div style="background: #F0F8FF; padding: 24px; border-radius: 8px; border-left: 4px solid #3498DB; margin-bottom: 32px;">
        <h2 style="color: #2980B9; margin: 0 0 16px 0; font-size: 24px;">Educational Content</h2>
        <p style="color: #2C1810; margin: 0; line-height: 1.6; font-size: 16px;">${
          message ||
          "Stay informed with the latest marketplace insights and tips for success."
        }</p>
      </div>
    `;
  } else if (campaignType === "promotional" || campaignType === "promotion") {
    const safeBannerUrl =
      bannerUrl ||
      "https://via.placeholder.com/600x200/D4A017/FFFFFF?text=Special+Offer";
    const safeCtaText = ctaText || "Shop Now";
    const safeCtaLink = ctaLink || "https://nileflowafrica.com";

    contentSection = `
      <div style="text-align: center; margin-bottom: 32px;">
        <img src="${safeBannerUrl}" alt="Promotional Banner" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">
        <a href="${safeCtaLink}" style="display: inline-block; background: linear-gradient(135deg, #D4A017, #B8860B); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">${safeCtaText}</a>
      </div>
    `;
  } else {
    // Generic content for marketing or other types
    contentSection = `
      <div style="background: #FAF7F2; padding: 24px; border-radius: 8px; margin-bottom: 32px;">
        <h2 style="color: #8B4513; margin: 0 0 16px 0; font-size: 24px;">Newsletter Update</h2>
        <p style="color: #2C1810; margin: 0; line-height: 1.6; font-size: 16px;">Thank you for being part of our marketplace community. We have exciting updates and products to share with you!</p>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
    </head>
   <body>
            <div class="container">
                <div class="header">
                    <h1>🛍️ ${subject}</h1>
                </div>
                <div class="content">
                    <h2 style="font-size: 24px; color: #333; margin-top: 0;">Hi [CustomerName],</h2>
                    <p style="font-size: 16px; color: #555;">Discover our latest and greatest products, handpicked just for you.</p>

                    <div class="product-grid">
                        ${productCardsHtml}
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://nileflowafrica.com/shop" class="cta-button">Shop All New Products</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; ${currentYear} Nile Mart. All rights reserved.</p>
                    <p>You are receiving this email because you subscribed to our newsletter.</p>
                    <p><a href="[UnsubscribeLink]" style="color: #999;">Unsubscribe</a></p>
                </div>
            </div>
        </body>
    </html>
  `;
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

// Get campaign types from database collection
const getCampaignTypes = async (req, res) => {
  try {
    // Default campaign types as fallback
    const defaultCampaignTypes = [
      {
        id: "marketing",
        label: "Marketing",
        color: "from-[#D4A017] to-[#B8860B]",
        icon: "TrendingUp",
        description: "Promote products and services to drive sales",
        isActive: true,
      },
      {
        id: "promotional",
        label: "Promotional",
        color: "from-[#27AE60] to-[#2ECC71]",
        icon: "Sparkles",
        description: "Special offers, discounts, and limited-time deals",
        isActive: true,
      },
      {
        id: "announcement",
        label: "Announcement",
        color: "from-[#3498DB] to-[#2980B9]",
        icon: "Bell",
        description: "Important updates and company news",
        isActive: true,
      },
      {
        id: "educational",
        label: "Educational",
        color: "from-[#9B59B6] to-[#8E44AD]",
        icon: "FileText",
        description: "Share knowledge, tips, and educational content",
        isActive: true,
      },
    ];

    let campaignTypes = [];

    try {
      // Try to fetch from database collection
      const { documents } = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_CAMPAIGN_TYPES_COLLECTION_ID || "campaign_types",
        [Query.equal("isActive", true), Query.orderAsc("sortOrder")]
      );

      if (documents && documents.length > 0) {
        campaignTypes = documents;
      } else {
        // If collection is empty, use defaults
        campaignTypes = defaultCampaignTypes;
      }
    } catch (collectionError) {
      console.log(
        "Campaign types collection not found, using defaults:",
        collectionError.message
      );

      // If collection doesn't exist, try to create it with default data
      try {
        // Create each default campaign type in the collection
        const createPromises = defaultCampaignTypes.map((type, index) => {
          return db.createDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_CAMPAIGN_TYPES_COLLECTION_ID || "campaign_types",
            ID.unique(),
            {
              ...type,
              sortOrder: index + 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          );
        });

        await Promise.allSettled(createPromises);
        console.log("Created default campaign types in database");
        campaignTypes = defaultCampaignTypes;
      } catch (createError) {
        console.log(
          "Could not create campaign types collection, using defaults"
        );
        campaignTypes = defaultCampaignTypes;
      }
    }

    res.status(200).json({
      success: true,
      campaignTypes,
      total: campaignTypes.length,
    });
  } catch (error) {
    console.error("Error fetching campaign types:", error);

    // Return default types if there's an error
    res.status(200).json({
      success: false,
      campaignTypes: [
        {
          id: "marketing",
          label: "Marketing",
          color: "from-[#D4A017] to-[#B8860B]",
          icon: "TrendingUp",
          description: "Promote products and services",
          isActive: true,
        },
        {
          id: "promotional",
          label: "Promotional",
          color: "from-[#27AE60] to-[#2ECC71]",
          icon: "Sparkles",
          description: "Special offers and deals",
          isActive: true,
        },
        {
          id: "announcement",
          label: "Announcement",
          color: "from-[#3498DB] to-[#2980B9]",
          icon: "Bell",
          description: "Important updates",
          isActive: true,
        },
        {
          id: "educational",
          label: "Educational",
          color: "from-[#9B59B6] to-[#8E44AD]",
          icon: "FileText",
          description: "Educational content",
          isActive: true,
        },
      ],
      total: 4,
      error: "Using fallback campaign types",
    });
  }
};

// Get dynamic audience statistics
const getAudienceStatistics = async (req, res) => {
  try {
    // Get total subscribers
    const { total: totalSubscribers } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NEWSLETTER_COLLECTION_ID,
      [Query.equal("subscribed", true)]
    );

    // Get VIP customers from users collection where isPremium = true
    const { total: vipCount } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID, // Make sure this env variable exists
      [Query.equal("isPremium", true)]
    );

    // Get new subscribers (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { total: newSubscribersCount } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NEWSLETTER_COLLECTION_ID,
      [
        Query.equal("subscribed", true),
        Query.greaterThanEqual("$createdAt", thirtyDaysAgo.toISOString()),
      ]
    );

    // Get active buyers (users who have made orders in last 90 days)
    // You'll need to adjust this based on your orders collection structure
    let activeBuyersCount = 0;
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { total: activeOrders } = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ORDER_COLLECTION_ID || "orders", // Adjust collection name as needed
        [
          Query.greaterThanEqual("$createdAt", ninetyDaysAgo.toISOString()),
          Query.notEqual("status", "cancelled"),
        ]
      );
      activeBuyersCount = activeOrders;
    } catch (error) {
      console.log("Could not fetch active buyers count:", error.message);
      activeBuyersCount = 0; // Fallback value
    }

    // Calculate inactive users (total subscribers - new subscribers - rough estimate)
    const inactiveUsersCount = Math.max(
      0,
      totalSubscribers -
        newSubscribersCount -
        Math.floor(activeBuyersCount * 0.7)
    );

    // Calculate engagement statistics
    const openRate =
      totalSubscribers > 0
        ? ((activeBuyersCount / totalSubscribers) * 100).toFixed(1)
        : "0.0";
    const clickRate =
      totalSubscribers > 0
        ? (((activeBuyersCount * 0.6) / totalSubscribers) * 100).toFixed(1)
        : "0.0";

    // Get active campaigns count
    const { total: activeCampaignsCount } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_SCHEDULED_CAMPAIGNS_COLLECTION_ID || "scheduled_campaigns",
      [Query.equal("status", "scheduled")]
    );

    const statistics = {
      totalSubscribers,
      openRate: `${openRate}%`,
      clickRate: `${clickRate}%`,
      activeCampaigns: activeCampaignsCount,
      audienceGroups: [
        {
          id: "all",
          label: "All Subscribers",
          count: totalSubscribers,
        },
        {
          id: "active",
          label: "Active Buyers",
          count: activeBuyersCount,
        },
        {
          id: "inactive",
          label: "Inactive Users",
          count: inactiveUsersCount,
        },
        {
          id: "new",
          label: "New Subscribers",
          count: newSubscribersCount,
        },
        {
          id: "vip",
          label: "VIP Customers",
          count: vipCount,
        },
      ],
    };

    res.status(200).json(statistics);
  } catch (error) {
    console.error("Error fetching audience statistics:", error);

    // Return fallback statistics if there's an error
    res.status(200).json({
      totalSubscribers: 0,
      openRate: "0.0%",
      clickRate: "0.0%",
      activeCampaigns: 0,
      audienceGroups: [
        { id: "all", label: "All Subscribers", count: 0 },
        { id: "active", label: "Active Buyers", count: 0 },
        { id: "inactive", label: "Inactive Users", count: 0 },
        { id: "new", label: "New Subscribers", count: 0 },
        { id: "vip", label: "VIP Customers", count: 0 },
      ],
      error: "Could not fetch some statistics",
    });
  }
};

const sendnewsletter = async (req, res) => {
  try {
    const {
      subject,
      campaignType,
      targetAudience,
      scheduledAt, // ISO string for scheduled delivery
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

    // Check if this is a scheduled campaign and handle timezone conversion
    let convertedScheduledAt = null;
    const isScheduled = scheduledAt && scheduledAt.trim() !== "";

    if (isScheduled) {
      try {
        // Convert the scheduled time to proper ISO format
        // Assuming the frontend sends time in East African Time (UTC+3)
        const scheduledDate = new Date(scheduledAt);

        // Check if the date is valid
        if (isNaN(scheduledDate.getTime())) {
          return res.status(400).json({
            error: "Invalid scheduled date format. Please use a valid date.",
          });
        }

        // Convert to ISO string for consistent storage
        convertedScheduledAt = scheduledDate.toISOString();

        // Check if the scheduled time is in the future
        const now = new Date();
        if (scheduledDate <= now) {
          return res.status(400).json({
            error: `Scheduled time must be in the future. Current time: ${now.toLocaleString(
              "en-US",
              { timeZone: "Africa/Nairobi" }
            )}, Scheduled time: ${scheduledDate.toLocaleString("en-US", {
              timeZone: "Africa/Nairobi",
            })}`,
          });
        }

        console.log(
          `Campaign scheduled for: ${scheduledDate.toLocaleString("en-US", {
            timeZone: "Africa/Nairobi",
          })} EAT (${convertedScheduledAt} UTC)`
        );
      } catch (dateError) {
        return res.status(400).json({
          error: "Invalid date format. Please provide a valid scheduled time.",
        });
      }
    }

    /**
     * ----------------------------
     * 1️⃣ Resolve campaign data
     * ----------------------------
     */
    let campaignData = { subject };

    // Map frontend campaign types to backend logic
    let mappedCampaignType = campaignType;
    if (campaignType === "promotional") {
      mappedCampaignType = "promotion";
    }

    // Validate campaign type
    const validCampaignTypes = [
      "marketing",
      "promotional",
      "promotion",
      "announcement",
      "educational",
      "products",
    ];
    if (!validCampaignTypes.includes(campaignType)) {
      return res.status(400).json({
        error: `Invalid campaign type. Supported types: ${validCampaignTypes.join(
          ", "
        )}`,
      });
    }

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

    if (campaignType === "promotion" || campaignType === "promotional") {
      // For promotional campaigns, use provided values or defaults
      // Ensure banner URL is properly formatted for email clients
      let safeBannerUrl = bannerUrl;
      if (bannerUrl) {
        // Handle Appwrite URLs - ensure they're accessible in emails
        if (bannerUrl.includes("appwrite.io")) {
          // Keep the original URL but ensure it's properly encoded
          safeBannerUrl = bannerUrl.replace(/&/g, "&amp;");
        }
      } else {
        safeBannerUrl =
          "https://via.placeholder.com/600x200/D4A017/FFFFFF?text=Special+Offer";
      }

      campaignData.bannerUrl = safeBannerUrl;
      campaignData.ctaText = ctaText || "Shop Now";
      campaignData.ctaLink = ctaLink || "https://nileflowafrica.com";
      campaignData.type = "promotional";
    }

    // Handle marketing campaigns (general newsletter with featured products)
    if (campaignType === "marketing") {
      const { documents: featuredProducts } = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        [Query.orderDesc("$createdAt"), Query.limit(4)]
      );

      if (featuredProducts.length === 0) {
        return res.status(404).json({ error: "No featured products found." });
      }

      campaignData.products = featuredProducts || [];
      campaignData.type = "marketing";
    }

    // Handle educational campaigns
    if (campaignType === "educational") {
      campaignData.type = "educational";
      if (message) {
        campaignData.message = message;
      }
    }

    /**
     * ----------------------------
     * 2️⃣ Render base HTML
     * ----------------------------
     */
    let baseHtml;
    const currentYear = new Date().getFullYear();

    // Use custom templates for each campaign type
    if (campaignType === "marketing") {
      const productCardsHtml = campaignData.products
        .map(
          (product) => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.productName}">
            <h3>${product.productName}</h3>
            <p>$${product.price.toFixed(2)}</p>
            <a href="https://nileflowafrica.com/featured-products/${
              product.productId
            }" style="display: inline-block; background-color: #e47d2b; color: #fff; padding: 8px 12px; text-decoration: none; border-radius: 5px; margin-top: 10px; font-weight: bold; font-size: 14px;">View Product</a>
        </div>
      `
        )
        .join("");

      baseHtml = `
        <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>New Arrivals at Nile Mart!${subject}</title>
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
                      <p>&copy; ${currentYear} Nile Mart. All rights reserved.</p>
                      <p>You are receiving this email because you subscribed to our newsletter.</p>
                      <p><a href="{{unsubscribe_link}}" style="color: #999;">Unsubscribe</a></p>
                  </div>
              </div>
          </body>
          </html>
      `;
    } else if (campaignType === "promotional" || campaignType === "promotion") {
      // Ensure banner URL is email-client friendly
      const safeBannerUrl =
        campaignData.bannerUrl ||
        "https://via.placeholder.com/600x200/D4A017/FFFFFF?text=Special+Offer";

      baseHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject} - Special Offer!</title>
            <style>
                body { font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; background-color: #fff; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.15); overflow: hidden; }
                .promo-header { background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: #fff; padding: 30px 20px; text-align: center; position: relative; }
                .promo-badge { position: absolute; top: 10px; right: 10px; background: #fff; color: #ee5a24; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; }
                .promo-header h1 { margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
                .content { padding: 40px 30px; text-align: center; }
                .promo-banner { margin: 20px 0; }
                .promo-banner img { width: 100%; max-width: 500px; height: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: block; margin: 0 auto; }
                .offer-highlight { background: linear-gradient(135deg, #ffecd2, #fcb69f); padding: 25px; border-radius: 15px; margin: 30px 0; border: 3px dashed #ee5a24; }
                .offer-text { font-size: 24px; color: #2c3e50; font-weight: bold; margin: 0; }
                .cta-button { display: inline-block; background: linear-gradient(135deg, #56ab2f, #a8e6cf); color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 18px; margin: 20px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
                .footer { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; text-align: center; padding: 25px; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="promo-header">
                    <div class="promo-badge">LIMITED TIME</div>
                    <h1>🎉 ${subject}</h1>
                </div>
                <div class="content">
                    <h2 style="font-size: 26px; color: #2c3e50; margin-top: 0;">Hello {{customer_name}}!</h2>
                    <p style="font-size: 18px; color: #34495e; line-height: 1.6;">Don't miss out on this exclusive offer just for you!</p>
                    
                    <div class="promo-banner">
                        <img src="${safeBannerUrl}" alt="Special Promotion" style="width: 100%; max-width: 500px; height: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: block; margin: 0 auto;">
                    </div>
                    
                    <div class="offer-highlight">
                        <p class="offer-text">🎁 Special Promotion Alert! 🎁</p>
                        <p style="font-size: 16px; color: #7f8c8d; margin-top: 10px;">Limited time offer - Act now!</p>
                    </div>
                    
                    <a href="${campaignData.ctaLink}" class="cta-button">${campaignData.ctaText}</a>
                </div>
                <div class="footer">
                    <p>&copy; ${currentYear} Nile Mart. All rights reserved.</p>
                    <p>You are receiving this promotional email because you subscribed to our newsletter.</p>
                    <p><a href="{{unsubscribe_link}}" style="color: #ecf0f1;">Unsubscribe</a></p>
                </div>
            </div>
        </body>
        </html>
      `;
    } else if (campaignType === "announcement") {
      baseHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject} - Important Update</title>
            <style>
                body { font-family: 'Georgia', serif; background-color: #f8f9fa; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #e9ecef; }
                .announcement-header { background: linear-gradient(135deg, #3498db, #2980b9); color: #fff; padding: 25px 20px; text-align: center; }
                .announcement-header h1 { margin: 0; font-size: 28px; font-weight: normal; }
                .content { padding: 40px 35px; }
                .announcement-badge { display: inline-block; background: #e74c3c; color: #fff; padding: 6px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
                .message-box { background: #f8f9fa; border-left: 5px solid #3498db; padding: 25px; margin: 25px 0; border-radius: 0 8px 8px 0; }
                .message-content { font-size: 16px; color: #2c3e50; line-height: 1.8; margin: 0; }
                .info-section { background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 25px 0; }
                .footer { background: #34495e; color: #bdc3c7; text-align: center; padding: 20px; font-size: 12px; }
                .footer a { color: #3498db; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="announcement-header">
                    <h1>📢 ${subject}</h1>
                </div>
                <div class="content">
                    <div class="announcement-badge">Important Notice</div>
                    <h2 style="font-size: 24px; color: #2c3e50; margin-top: 0;">Dear {{customer_name}},</h2>
                    
                    <div class="message-box">
                        <p class="message-content">${campaignData.message}</p>
                    </div>
                    
                    <div class="info-section">
                        <p style="font-size: 14px; color: #34495e; margin: 0; text-align: center;">
                            <strong>Need assistance?</strong> Our support team is here to help.
                        </p>
                    </div>
                    
                    <p style="font-size: 16px; color: #7f8c8d; text-align: center; margin-top: 30px;">
                        Thank you for being a valued member of our community.
                    </p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://nileflowafrica.com/support" style="display: inline-block; background-color: #3498db; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Contact Support</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; ${currentYear} Nile Mart. All rights reserved.</p>
                    <p>This is an important announcement from Nile Mart.</p>
                    <p><a href="{{unsubscribe_link}}">Unsubscribe</a></p>
                </div>
            </div>
        </body>
        </html>
      `;
    } else if (campaignType === "educational") {
      const educationalMessage =
        campaignData.message ||
        "Stay informed with the latest marketplace insights and tips for success.";
      baseHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject} - Learn & Grow</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f8ff; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; background-color: #fff; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.08); overflow: hidden; }
                .edu-header { background: linear-gradient(135deg, #4a90e2, #357abd); color: #fff; padding: 30px 20px; text-align: center; }
                .edu-header h1 { margin: 0; font-size: 28px; }
                .content { padding: 35px; }
                .learning-badge { display: inline-block; background: #28a745; color: #fff; padding: 5px 12px; border-radius: 15px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 15px; }
                .content-section { background: #f8f9fa; border-left: 4px solid #4a90e2; padding: 25px; margin: 25px 0; border-radius: 0 8px 8px 0; }
                .tip-box { background: linear-gradient(135deg, #e3f2fd, #bbdefb); padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #2196f3; }
                .tip-title { font-size: 18px; color: #1976d2; font-weight: bold; margin: 0 0 10px 0; }
                .resources-section { background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 5px solid #ffc107; margin: 25px 0; }
                .footer { background: #495057; color: #adb5bd; text-align: center; padding: 20px; font-size: 12px; }
                .footer a { color: #4a90e2; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="edu-header">
                    <h1>📚 ${subject}</h1>
                </div>
                <div class="content">
                    <div class="learning-badge">Educational Content</div>
                    <h2 style="font-size: 24px; color: #2c3e50; margin-top: 0;">Hello {{customer_name}}!</h2>
                    <p style="font-size: 16px; color: #6c757d;">Welcome to your weekly dose of marketplace knowledge and insights.</p>
                    
                    <div class="content-section">
                        <p style="font-size: 16px; color: #495057; line-height: 1.7; margin: 0;">${educationalMessage}</p>
                    </div>
                    
                    <div class="tip-box">
                        <p class="tip-title">💡 Pro Tip</p>
                        <p style="font-size: 14px; color: #37474f; margin: 0; line-height: 1.6;">
                            Stay ahead of the curve by regularly checking our marketplace for the latest trends and opportunities.
                        </p>
                    </div>
                    
                    <div class="resources-section">
                        <h3 style="font-size: 18px; color: #856404; margin: 0 0 15px 0;">📖 Additional Resources</h3>
                        <ul style="color: #6c757d; font-size: 14px; line-height: 1.6;">
                            <li>Browse our comprehensive product catalog</li>
                            <li>Join our community discussions</li>
                            <li>Access our seller resources and guides</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://nileflowafrica.com/learn" style="display: inline-block; background-color: #4a90e2; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">Learn More</a>
                        <a href="https://nileflowafrica.com/community" style="display: inline-block; background-color: #28a745; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Community</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; ${currentYear} Nile Mart. All rights reserved.</p>
                    <p>You are receiving this educational newsletter because you subscribed to our learning content.</p>
                    <p><a href="{{unsubscribe_link}}">Unsubscribe</a></p>
                </div>
            </div>
        </body>
        </html>
      `;
    } else if (campaignType === "products") {
      const productCardsHtml = campaignData.products
        .map(
          (product) => `
        <div class="featured-product">
            <div class="product-image">
                <img src="${product.image}" alt="${product.productName}">
                <div class="new-badge">NEW</div>
            </div>
            <div class="product-details">
                <h3>${product.productName}</h3>
                <p class="product-description">${
                  product.description ||
                  "Discover this amazing product in our marketplace."
                }</p>
                <div class="price-section">
                    <span class="price">$${product.price.toFixed(2)}</span>
                    ${
                      product.originalPrice
                        ? `<span class="original-price">$${product.originalPrice.toFixed(
                            2
                          )}</span>`
                        : ""
                    }
                </div>
                <a href="https://nileflowafrica.com/products/${
                  product.productId
                }" class="product-cta">View Details</a>
            </div>
        </div>
      `
        )
        .join("");

      baseHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject} - New Products</title>
            <style>
                body { font-family: 'Arial', sans-serif; background-color: #f5f7fa; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
                .products-header { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff; padding: 25px 20px; text-align: center; }
                .products-header h1 { margin: 0; font-size: 28px; }
                .content { padding: 30px 25px; }
                .featured-product { background: #fff; border: 1px solid #e9ecef; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.3s ease; }
                .product-image { position: relative; text-align: center; margin-bottom: 15px; }
                .product-image img { width: 100%; max-width: 200px; height: auto; border-radius: 8px; }
                .new-badge { position: absolute; top: 10px; right: 10px; background: #00b894; color: #fff; padding: 4px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; }
                .product-details h3 { font-size: 20px; color: #2d3436; margin: 0 0 10px 0; text-align: center; }
                .product-description { font-size: 14px; color: #636e72; line-height: 1.5; text-align: center; margin-bottom: 15px; }
                .price-section { text-align: center; margin: 15px 0; }
                .price { font-size: 22px; color: #00b894; font-weight: bold; }
                .original-price { font-size: 16px; color: #b2bec3; text-decoration: line-through; margin-left: 10px; }
                .product-cta { display: block; width: fit-content; margin: 15px auto 0; background-color: #6c5ce7; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 14px; text-align: center; }
                .cta-section { background: #f8f9fa; padding: 25px; margin: 30px 0; border-radius: 10px; text-align: center; }
                .main-cta { display: inline-block; background: linear-gradient(135deg, #fd79a8, #e84393); color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; }
                .footer { background: #2d3436; color: #b2bec3; text-align: center; padding: 20px; font-size: 12px; }
                .footer a { color: #6c5ce7; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="products-header">
                    <h1>✨ ${subject}</h1>
                </div>
                <div class="content">
                    <h2 style="font-size: 24px; color: #2d3436; margin-top: 0; text-align: center;">Hi {{customer_name}}!</h2>
                    <p style="font-size: 16px; color: #636e72; text-align: center; margin-bottom: 30px;">Check out our latest product arrivals, carefully selected just for you.</p>
                    
                    ${productCardsHtml}
                    
                    <div class="cta-section">
                        <h3 style="color: #2d3436; margin: 0 0 15px 0;">Discover More Amazing Products</h3>
                        <p style="font-size: 14px; color: #636e72; margin-bottom: 20px;">Explore our full catalog of premium products.</p>
                        <a href="https://nileflowafrica.com/products" class="main-cta">Browse All Products</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; ${currentYear} Nile Mart. All rights reserved.</p>
                    <p>You are receiving this product update because you subscribed to our newsletter.</p>
                    <p><a href="{{unsubscribe_link}}">Unsubscribe</a></p>
                </div>
            </div>
        </body>
        </html>
      `;
    } else {
      // Fallback to existing renderNewsletter function for any other types
      try {
        baseHtml = renderNewsletter({
          campaignType: campaignType,
          data: campaignData,
        });
      } catch (error) {
        console.warn(
          "Newsletter renderer failed, using fallback template:",
          error.message
        );
        baseHtml = generateFallbackTemplate(campaignData, campaignType);
      }
    }

    /**
     * ----------------------------
     * 3️⃣ Handle Scheduling
     * ----------------------------
     */
    if (isScheduled) {
      // For scheduled campaigns, save to database and return success
      // You would typically use a job queue like Bull/Agenda or cron jobs
      // For now, we'll simulate scheduling by saving the campaign data

      const scheduledCampaign = {
        subject,
        campaignType,
        targetAudience,
        scheduledAt: convertedScheduledAt, // Use the converted ISO timestamp
        // Store only essential minimal data instead of full campaignData object
        campaignMetadata: JSON.stringify({
          type: campaignData.type || campaignType,
          hasProducts: !!(
            campaignData.products && campaignData.products.length > 0
          ),
          productCount: campaignData.products
            ? campaignData.products.length
            : 0,
        }),
        // Store additional fields needed to regenerate the template
        message: message || "",
        bannerUrl: bannerUrl || "",
        ctaText: ctaText || "",
        ctaLink: ctaLink || "",
        status: "scheduled",
        createdAt: new Date().toISOString(),
      };

      // Save to a scheduled campaigns collection (you'll need to create this)
      try {
        await db.createDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_SCHEDULED_CAMPAIGNS_COLLECTION_ID ||
            "scheduled_campaigns", // Add this to your env
          ID.unique(),
          scheduledCampaign
        );

        return res.status(200).json({
          message: `Campaign scheduled successfully for ${new Date(
            convertedScheduledAt
          ).toLocaleString("en-US", { timeZone: "Africa/Nairobi" })} EAT`,
          scheduledAt: convertedScheduledAt,
          scheduledAtLocal: new Date(convertedScheduledAt).toLocaleString(
            "en-US",
            { timeZone: "Africa/Nairobi" }
          ),
          campaignType,
          isScheduled: true,
        });
      } catch (scheduleError) {
        console.error("Error scheduling campaign:", scheduleError);
        return res.status(500).json({
          error:
            "Failed to schedule campaign. Scheduling service is currently unavailable.",
          details: scheduleError.message,
        });
      }
    }

    /**
     * ----------------------------
     * 4️⃣ Resolve audience
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
     * 5️⃣ Send personalized emails
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
     * 6️⃣ Response
     * ----------------------------
     */
    res.status(200).json({
      message: "Campaign sent successfully.",
      sent: subscribers.length,
      campaignType,
      isScheduled: false,
    });
  } catch (error) {
    console.error("Newsletter error:", error);
    res.status(500).json({
      error: "Failed to send newsletter campaign.",
    });
  }
};

// Function to process scheduled campaigns (call this with a cron job)
const processScheduledCampaigns = async () => {
  try {
    const now = new Date().toISOString();
    console.log(`\n🔄 Processing scheduled campaigns at: ${now}`);
    console.log(`⏰ Current time (UTC): ${now}`);
    console.log(
      `⏰ Current time (EAT): ${new Date().toLocaleString("en-US", {
        timeZone: "Africa/Nairobi",
      })}`
    );

    // Get all scheduled campaigns that are due to be sent
    const { documents: scheduledCampaigns } = await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_SCHEDULED_CAMPAIGNS_COLLECTION_ID || "scheduled_campaigns",
      [
        Query.equal("status", "scheduled"),
        Query.lessThanEqual("scheduledAt", now),
      ]
    );

    console.log(
      `📧 Found ${scheduledCampaigns.length} scheduled campaigns to process`
    );

    if (!scheduledCampaigns.length) {
      // Also check for all scheduled campaigns (not just due ones) for debugging
      const { documents: allScheduledCampaigns } = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_SCHEDULED_CAMPAIGNS_COLLECTION_ID || "scheduled_campaigns",
        [Query.equal("status", "scheduled")]
      );

      if (allScheduledCampaigns.length > 0) {
        console.log(
          `📅 Found ${allScheduledCampaigns.length} scheduled campaigns (not yet due):`
        );
        allScheduledCampaigns.forEach((campaign) => {
          console.log(
            `  - "${campaign.subject}" scheduled for: ${
              campaign.scheduledAt
            } (${new Date(campaign.scheduledAt).toLocaleString("en-US", {
              timeZone: "Africa/Nairobi",
            })} EAT)`
          );
        });
      } else {
        console.log("❌ No scheduled campaigns found in database");
      }
      return;
    }

    for (const campaign of scheduledCampaigns) {
      try {
        // Parse the stringified campaign metadata (if it exists)
        let parsedMetadata = {};
        try {
          if (campaign.campaignMetadata) {
            parsedMetadata = JSON.parse(campaign.campaignMetadata);
          } else if (campaign.campaignData) {
            // Fallback for old campaigns that might still have campaignData
            parsedMetadata = JSON.parse(campaign.campaignData);
          }
        } catch (parseError) {
          console.error("Error parsing campaign metadata:", parseError);
          // Continue with default metadata if parsing fails
          parsedMetadata = { type: campaign.campaignType };
        }

        // Regenerate HTML content from stored campaign parameters
        let htmlContent;
        const currentYear = new Date().getFullYear();

        try {
          // Regenerate the template based on campaign type and stored parameters
          if (campaign.campaignType === "marketing") {
            // Re-fetch products for marketing campaigns
            const { documents: featuredProducts } = await db.listDocuments(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_PRODUCT_COLLECTION_ID,
              [Query.orderDesc("$createdAt"), Query.limit(4)]
            );

            const productCardsHtml = featuredProducts
              .map(
                (product) => `
            <div class="product-card">
                <img src="${product.image}" alt="${product.productName}">
                <h3>${product.productName}</h3>
                <p>$${product.price.toFixed(2)}</p>
                <a href="https://nileflowafrica.com/featured-products/${
                  product.productId
                }" style="display: inline-block; background-color: #e47d2b; color: #fff; padding: 8px 12px; text-decoration: none; border-radius: 5px; margin-top: 10px; font-weight: bold; font-size: 14px;">View Product</a>
            </div>
          `
              )
              .join("");

            htmlContent = `
            <!DOCTYPE html>
              <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>New Arrivals at Nile Mart!${campaign.subject}</title>
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
                          <h1>🛍️ ${campaign.subject}</h1>
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
                          <p>&copy; ${currentYear} Nile Mart. All rights reserved.</p>
                          <p>You are receiving this email because you subscribed to our newsletter.</p>
                          <p><a href="{{unsubscribe_link}}" style="color: #999;">Unsubscribe</a></p>
                      </div>
                  </div>
              </body>
              </html>
            `;
          } else if (campaign.campaignType === "promotional") {
            const safeBannerUrl =
              campaign.bannerUrl ||
              "https://via.placeholder.com/600x200/D4A017/FFFFFF?text=Special+Offer";

            htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${campaign.subject} - Special Offer!</title>
                <style>
                    body { font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 20px auto; background-color: #fff; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.15); overflow: hidden; }
                    .promo-header { background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: #fff; padding: 30px 20px; text-align: center; position: relative; }
                    .promo-badge { position: absolute; top: 10px; right: 10px; background: #fff; color: #ee5a24; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; }
                    .promo-header h1 { margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
                    .content { padding: 40px 30px; text-align: center; }
                    .promo-banner { margin: 20px 0; }
                    .promo-banner img { width: 100%; max-width: 500px; height: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: block; margin: 0 auto; }
                    .offer-highlight { background: linear-gradient(135deg, #ffecd2, #fcb69f); padding: 25px; border-radius: 15px; margin: 30px 0; border: 3px dashed #ee5a24; }
                    .offer-text { font-size: 24px; color: #2c3e50; font-weight: bold; margin: 0; }
                    .cta-button { display: inline-block; background: linear-gradient(135deg, #56ab2f, #a8e6cf); color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 18px; margin: 20px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
                    .footer { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; text-align: center; padding: 25px; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="promo-header">
                        <div class="promo-badge">LIMITED TIME</div>
                        <h1>🎉 ${campaign.subject}</h1>
                    </div>
                    <div class="content">
                        <h2 style="font-size: 26px; color: #2c3e50; margin-top: 0;">Hello {{customer_name}}!</h2>
                        <p style="font-size: 18px; color: #34495e; line-height: 1.6;">Don't miss out on this exclusive offer just for you!</p>
                        
                        <div class="promo-banner">
                            <img src="${safeBannerUrl}" alt="Special Promotion" style="width: 100%; max-width: 500px; height: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: block; margin: 0 auto;">
                        </div>
                        
                        <div class="offer-highlight">
                            <p class="offer-text">🎁 Special Promotion Alert! 🎁</p>
                            <p style="font-size: 16px; color: #7f8c8d; margin-top: 10px;">Limited time offer - Act now!</p>
                        </div>
                        
                        <a href="${
                          campaign.ctaLink || "https://nileflowafrica.com"
                        }" class="cta-button">${
              campaign.ctaText || "Shop Now"
            }</a>
                    </div>
                    <div class="footer">
                        <p>&copy; ${currentYear} Nile Mart. All rights reserved.</p>
                        <p>You are receiving this promotional email because you subscribed to our newsletter.</p>
                        <p><a href="{{unsubscribe_link}}" style="color: #ecf0f1;">Unsubscribe</a></p>
                    </div>
                </div>
            </body>
            </html>
            `;
          } else if (campaign.campaignType === "announcement") {
            htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${campaign.subject} - Important Update</title>
                <style>
                    body { font-family: 'Georgia', serif; background-color: #f8f9fa; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 20px auto; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid #e9ecef; }
                    .announcement-header { background: linear-gradient(135deg, #3498db, #2980b9); color: #fff; padding: 25px 20px; text-align: center; }
                    .content { padding: 40px 35px; }
                    .message-box { background: #f8f9fa; border-left: 5px solid #3498db; padding: 25px; margin: 25px 0; border-radius: 0 8px 8px 0; }
                    .footer { background: #34495e; color: #bdc3c7; text-align: center; padding: 20px; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="announcement-header">
                        <h1>📢 ${campaign.subject}</h1>
                    </div>
                    <div class="content">
                        <h2 style="font-size: 24px; color: #2c3e50; margin-top: 0;">Dear {{customer_name}},</h2>
                        <div class="message-box">
                            <p style="font-size: 16px; color: #2c3e50; line-height: 1.8; margin: 0;">${campaign.message}</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>&copy; ${currentYear} Nile Mart. All rights reserved.</p>
                        <p><a href="{{unsubscribe_link}}">Unsubscribe</a></p>
                    </div>
                </div>
            </body>
            </html>
            `;
          } else {
            // Fallback template for other campaign types
            htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${campaign.subject}</title>
            </head>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 8px;">
                    <h1 style="color: #333;">${campaign.subject}</h1>
                    <p>Hi {{customer_name}},</p>
                    <p>Thank you for being a valued subscriber!</p>
                    <p>&copy; ${currentYear} Nile Mart. All rights reserved.</p>
                    <p><a href="{{unsubscribe_link}}">Unsubscribe</a></p>
                </div>
            </body>
            </html>
            `;
          }
        } catch (templateError) {
          console.error("Error regenerating template:", templateError);
          // Use a simple fallback template
          htmlContent = `
          <html>
            <body style="font-family: Arial, sans-serif; margin: 20px;">
              <h1>${campaign.subject}</h1>
              <p>Hello {{customer_name}},</p>
              <p>We have an update from Nile Mart for you.</p>
              <p>Best regards,<br>The Nile Mart Team</p>
              <p><a href="{{unsubscribe_link}}">Unsubscribe</a></p>
            </body>
          </html>
          `;
        }
        // Get subscribers for this campaign
        const audienceQueries = [Query.equal("subscribed", true)];

        if (campaign.targetAudience === "vip") {
          audienceQueries.push(Query.equal("isVIP", true));
        }

        const { documents: subscribers } = await db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_NEWSLETTER_COLLECTION_ID,
          audienceQueries
        );

        if (subscribers.length > 0) {
          // Send emails to all subscribers using the stored or regenerated HTML content
          const emailJobs = subscribers.map((subscriber) => {
            const personalizedHtml = htmlContent
              .replace(/{{customer_name}}/g, subscriber.name?.trim() || "there")
              .replace(
                /{{unsubscribe_link}}/g,
                `https://nileflowafrica.com/unsubscribe?email=${encodeURIComponent(
                  subscriber.email
                )}`
              );

            return sendNewsletterEmail({
              toEmail: subscriber.email,
              subject: campaign.subject,
              htmlContent: personalizedHtml,
            });
          });

          await Promise.allSettled(emailJobs);

          // Update campaign status to sent
          await db.updateDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_SCHEDULED_CAMPAIGNS_COLLECTION_ID ||
              "scheduled_campaigns",
            campaign.$id,
            {
              status: "sent",
              sentAt: new Date().toISOString(),
              recipientCount: subscribers.length,
            }
          );

          console.log(
            `Scheduled campaign "${campaign.subject}" sent to ${subscribers.length} subscribers`
          );
        }
      } catch (error) {
        console.error(`Error processing campaign ${campaign.$id}:`, error);

        // Mark campaign as failed
        try {
          await db.updateDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_SCHEDULED_CAMPAIGNS_COLLECTION_ID ||
              "scheduled_campaigns",
            campaign.$id,
            {
              status: "failed",
              error: error.message,
              failedAt: new Date().toISOString(),
            }
          );
        } catch (updateError) {
          console.error(`Error updating failed campaign status:`, updateError);
        }
      }
    }
  } catch (error) {
    console.error("Error in processScheduledCampaigns:", error);
  }
};

// Manual trigger endpoint for processing scheduled campaigns
const triggerScheduledCampaigns = async (req, res) => {
  try {
    console.log("Manually triggering scheduled campaigns...");
    await processScheduledCampaigns();

    res.status(200).json({
      message: "Scheduled campaigns processing completed.",
      timestamp: new Date().toISOString(),
      triggeredBy: "manual",
    });
  } catch (error) {
    console.error("Error triggering scheduled campaigns:", error);
    res.status(500).json({
      error: "Failed to process scheduled campaigns.",
      details: error.message,
    });
  }
};

module.exports = {
  newsletter,
  sendnewsletter,
  getAudienceStatistics, // Export the new function
  getCampaignTypes, // Export the campaign types function
  processScheduledCampaigns, // Export the scheduler function
  triggerScheduledCampaigns, // Export the manual trigger function
};
