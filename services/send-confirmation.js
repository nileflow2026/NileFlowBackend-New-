const { Resend } = require("resend");
const { env } = require("../src/env");
const { db, users } = require("./appwriteService");
const { Query, ID } = require("node-appwrite");
const {
  generateAuthTokens,
  generateRefreshToken,
} = require("../utils/tokenUtils");
const resend = new Resend(env.RESEND_API_KEY);

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
      from: "Nile Flow <delivered@resend.dev>",
      to: customerEmail,
      subject: `Order #${orderId} Confirmed`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #1c1c1c; padding: 20px;">
                <h1 style="margin: 0; color: #fff; font-size: 24px; text-align: center;">🛍️ Nile Mart</h1>
            </div>

            <div style="padding: 30px;">
                <h2 style="font-size: 20px; margin-top: 0;">Hi ${customerName},</h2>
                <p style="font-size: 16px;">Thank you for your order <strong>#${orderId}</strong>! Here’s what you bought:</p>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background: #f9f9f9;">
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Item</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Qty</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${
                      Array.isArray(cart)
                        ? cart
                            .map(
                              (item) => `
                  
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; display: flex; align-items: center;">
                            <img src="${item.productImage}" alt="${item.productName}" width="60" style="margin-right: 15px; border-radius: 4px;" />
                            <div style="font-size: 14px;">${item.productName}</div>
                        </td>
                        <td style="padding: 10px; text-align: right;">${item.quantity}</td>
                        <td style="padding: 10px; text-align: right;">$${item.price.toFixed(2)}</td>
                        </tr>

                    `
                            )
                            .join("")
                        : ""
                    }
                </tbody>
                </table>

                <div style="text-align: right; font-size: 16px; margin-top: 20px;">
                <p><strong>Total:</strong> $${orderTotal.toFixed(2)}</p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                <a href="https://yourdomain.com/track/${orderId}" 
                    style="background: #1c1c1c; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
                    🚚 Track Your Order
                </a>
                </div>

                <p style="font-size: 15px;">We’ll email you again when your package ships. If you have questions, reply to this email anytime.</p>

                <p style="margin-top: 30px; font-size: 16px;">— The Nile Mart Team</p>
            </div>

            <div style="background-color: #1c1c1c; padding: 15px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #bbb;">
                Nile Mart | Juba, South Sudan | <a href="mailto:support@nilemart.com" style="color: #bbb;">support@nilemart.com</a>
                </p>
            </div>
            </div>
        </div>
        `,
    });
  } catch (err) {
    console.error("Email sending failed:", err);
    throw err;
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
      from: "Nile Mart <delivered@resend.dev>",
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
        Nile Flow | Nairobi, Kenya | <a href="mailto:support@nileflow.com" style="color: #999; text-decoration: none;">support@nileflow.com</a>
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
      from: "Nile Flow <no-reply@resend.dev>", // Your verified Resend domain
      to: customerEmail,
      subject: "Verify Your Nile Flow Account",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7f7f7;">
          <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333;">Hello ${customerName},</h2>
            <p style="font-size: 16px; color: #555;">Thank you for signing up with Nile Mart! Please use the following code to verify your account:</p>
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

const verifyCustomer = async (req, res) => {
  const { email, verificationCode } = req.body;

  if (!email || !verificationCode) {
    return res
      .status(400)
      .json({ error: "Email and verification code are required." });
  }

  try {
    // Retrieve the stored verification code for this email
    // This is a placeholder; you would use a database, Redis, or similar
    const storedCode = await getStoredVerificationCode(email);

    if (!storedCode || storedCode !== verificationCode) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification code." });
    }

    // Mark the user as verified in your database
    await markUserAsVerified(email); // A new function you'll create

    // Invalidate the verification code so it can't be reused
    await deleteVerificationCode(email);

    return res
      .status(200)
      .json({ message: "Email and phone number verified successfully." });
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
      [Query.equal("email", email)]
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
      [Query.equal("email", email)]
    );

    if (existingDocs.documents.length > 0) {
      // If a document exists, update the existing one with the new code and time
      const documentId = existingDocs.documents[0].$id;
      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_VERIFICATION_COLLECTION_ID,
        documentId,
        { code, createdAt: new Date().toISOString() }
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
        }
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
      [Query.equal("email", email)]
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
      [Query.equal("email", email)]
    );

    if (response.documents.length > 0) {
      const documentId = response.documents[0].$id;
      await db.deleteDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_VERIFICATION_COLLECTION_ID,
        documentId
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
      [Query.equal("email", email)]
    );

    if (profileList.documents.length > 0) {
      const profileId = profileList.documents[0].$id;
      await db.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_USER_COLLECTION_ID,
        profileId,
        { isVerified: true }
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

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendVerificationEmail,
  verifyCustomer,
  storeVerificationCode,
  markUserAsVerified,
  resendVerificationCode,
  verifyCustomerMobile,
};
