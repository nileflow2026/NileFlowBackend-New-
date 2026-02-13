# M-Pesa Integration Setup Guide

## 🎯 Quick Solution for "Invalid CallBackURL" Error

```bash
# 1. Install ngrok (if not installed)
# Download from https://ngrok.com/download

# 2. Run ngrok on your backend port
ngrok http 3000

# 3. Copy the HTTPS URL (e.g., https://abcd-1234.ngrok-free.app)

# 4. Update your backend .env file
BACKEND_URL=https://abcd-1234.ngrok-free.app

# 5. Restart your backend server
# Ctrl+C to stop, then start again

# 6. Test M-Pesa payment again!
```

---

## 🔴 Current Error: "Bad Request - Invalid CallBackURL"

**Good news:** Your M-Pesa credentials are working! ✅

**Issue:** M-Pesa cannot reach your callback URL. `localhost` or local IPs don't work because M-Pesa servers need to send callbacks to a publicly accessible URL.

---

## 🚀 Quick Fix: Use ngrok for Local Development

### Solution 1: Using ngrok (Recommended for Testing)

## 🚀 Quick Fix: Use ngrok for Local Development

### Solution 1: Using ngrok (Recommended for Testing)

**ngrok** creates a secure tunnel to your localhost, giving you a public URL that M-Pesa can reach.

#### Step 1: Install ngrok

**Windows:**

```bash
# Download from https://ngrok.com/download
# Or use chocolatey:
choco install ngrok
```

**Mac:**

```bash
brew install ngrok/ngrok/ngrok
```

**Or download directly:** https://ngrok.com/download

#### Step 2: Start ngrok

```bash
# If your backend runs on port 3000:
ngrok http 3000
```

You'll see output like:

```
Forwarding   https://abcd-1234-5678.ngrok-free.app -> http://localhost:3000
```

#### Step 3: Update Your Backend .env

Copy the HTTPS URL from ngrok and update:

```env
BACKEND_URL=https://abcd-1234-5678.ngrok-free.app
```

**Important:**

- Use the **HTTPS** URL (not HTTP)
- Don't add a trailing slash
- Must be the exact URL ngrok gives you

#### Step 4: Restart Your Backend

```bash
# Stop your server (Ctrl+C)
# Start it again
npm start
# or
node server.js
```

#### Step 5: Test M-Pesa Payment

Now M-Pesa can reach your callback at:

```
https://abcd-1234-5678.ngrok-free.app/api/payments/mpesa/callback
```

---

### Solution 2: Deploy Backend to Cloud (Production)

For production, deploy your backend to a service with a public URL:

**Options:**

- **Render.com** (Free tier available)
- **Railway.app** (Free tier)
- **Heroku**
- **DigitalOcean**
- **AWS/Azure/GCP**

Then use your deployment URL:

```env
BACKEND_URL=https://your-app.onrender.com
```

---

## ✅ Verify Your Setup

### Check Your Backend Code

Make sure your callback URL is correctly formatted in the STK push request:

```javascript
const stkPayload = {
  BusinessShortCode: shortCode,
  Password: password,
  Timestamp: timestamp,
  TransactionType: "CustomerPayBillOnline",
  Amount: Math.round(parseFloat(amount)),
  PartyA: formattedPhone,
  PartyB: shortCode,
  PhoneNumber: formattedPhone,
  // ✅ IMPORTANT: Must be publicly accessible HTTPS URL
  CallBackURL: `${process.env.BACKEND_URL}/api/payments/mpesa/callback`,
  AccountReference: accountReference || orderId,
  TransactionDesc: transactionDesc || `Payment for order ${orderId}`,
};
```

**Common CallBackURL Mistakes:**

❌ **Using localhost:**

```javascript
CallBackURL: "http://localhost:3000/api/payments/mpesa/callback"; // Won't work!
```

❌ **Using HTTP instead of HTTPS:**

```javascript
CallBackURL: "http://my-app.com/callback"; // M-Pesa requires HTTPS
```

❌ **Missing /api/payments/mpesa/callback path:**

```javascript
CallBackURL: "https://my-app.com"; // Needs full path
```

✅ **Correct format:**

```javascript
CallBackURL: "https://abcd-1234.ngrok-free.app/api/payments/mpesa/callback";
```

---

## 🔍 Testing Checklist

- [ ] ngrok is running and shows HTTPS URL
- [ ] `BACKEND_URL` in `.env` matches ngrok HTTPS URL (no trailing slash)
- [ ] Backend server restarted after updating `.env`
- [ ] Callback endpoint exists: `POST /api/payments/mpesa/callback`
- [ ] Using test phone number: `254708374149`

---

## ✅ Quick Fix Steps

### 1. Check Your Environment Variables

Open your backend `.env` file and verify these variables exist and are correct:

```env
# M-Pesa Credentials
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey_here
MPESA_ENVIRONMENT=sandbox

# Backend URL for callbacks
BACKEND_URL=http://localhost:3000

# Appwrite (if needed for orders)
APPWRITE_DATABASE_ID=your_database_id
APPWRITE_ORDERS_COLLECTION=your_orders_collection_id
```

### 2. Get Sandbox Credentials (For Testing)

1. **Go to:** https://developer.safaricom.co.ke
2. **Sign up/Login** to your account
3. **Create a new app:**
   - Click "My Apps"
   - Click "Add a New App"
   - Give it a name (e.g., "Nile Flow Payment")
   - Select "Lipa Na M-Pesa Sandbox" API
4. **Get your credentials:**
   - After creating the app, click on it
   - Copy the **Consumer Key**
   - Copy the **Consumer Secret**
5. **Use Sandbox Test Credentials:**
   ```
   MPESA_SHORTCODE=174379
   MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
   ```

### 3. Common Mistakes to Avoid

❌ **Spaces in credentials:**

```env
# WRONG:
MPESA_CONSUMER_KEY= your_key_here  # Space before key
MPESA_CONSUMER_SECRET=your_secret_here   # Space after secret

# CORRECT:
MPESA_CONSUMER_KEY=your_key_here
MPESA_CONSUMER_SECRET=your_secret_here
```

❌ **Mixing sandbox and production:**

```env
# WRONG: Production credentials with sandbox environment
MPESA_CONSUMER_KEY=prod_key
MPESA_ENVIRONMENT=sandbox

# CORRECT: Use matching credentials and environment
MPESA_CONSUMER_KEY=sandbox_key
MPESA_ENVIRONMENT=sandbox
```

❌ **Missing variables:**
Make sure ALL required variables are present.

### 4. Test Your Credentials

Create a test script to verify your M-Pesa credentials work:

```javascript
// test-mpesa.js
require("dotenv").config();

async function testMpesaAuth() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  console.log("Consumer Key:", consumerKey?.substring(0, 10) + "...");
  console.log("Consumer Secret:", consumerSecret?.substring(0, 10) + "...");

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64"
  );

  const url =
    process.env.MPESA_ENVIRONMENT === "production"
      ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
      : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  console.log("Testing URL:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ SUCCESS! Access token received");
      console.log("Token:", data.access_token?.substring(0, 20) + "...");
    } else {
      console.log("❌ FAILED!");
      console.log("Status:", response.status);
      console.log("Response:", data);
    }
  } catch (error) {
    console.log("❌ ERROR:", error.message);
  }
}

testMpesaAuth();
```

Run it:

```bash
node test-mpesa.js
```

### 5. Verify Your Backend Code

Make sure your `getMpesaAccessToken` function looks like this:

```javascript
async function getMpesaAccessToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  // Check if credentials exist
  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa credentials not configured. Check your .env file.");
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64"
  );

  const url =
    process.env.MPESA_ENVIRONMENT === "production"
      ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
      : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("M-Pesa OAuth error response:", errorData);
      throw new Error(`M-Pesa auth failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("M-Pesa OAuth error:", error);
    throw error;
  }
}
```

---

## 📱 Testing M-Pesa Payments (Sandbox)

### Test Phone Numbers

Use these Safaricom Sandbox test numbers:

- **254708374149** (Default test number)
- **254711111111** to **254733333333** (Other test numbers)

### Test Credentials Summary

```env
MPESA_CONSUMER_KEY=[Get from your Daraja app]
MPESA_CONSUMER_SECRET=[Get from your Daraja app]
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_ENVIRONMENT=sandbox
```

### Testing Flow

1. Enter a test phone number (254708374149)
2. You'll receive an STK push on the Daraja simulator
3. Enter PIN: **Any 4 digits** (sandbox accepts any PIN)
4. Payment will be processed

---

## 🚀 Moving to Production

### Requirements

1. **Register for Production API:**

   - Email: apisupport@safaricom.co.ke
   - Provide: Business details, KRA PIN, registration docs

2. **Get Production Credentials:**

   - Approved business shortcode
   - Production Consumer Key/Secret
   - Production passkey

3. **Update Environment:**

   ```env
   MPESA_CONSUMER_KEY=[Production Key]
   MPESA_CONSUMER_SECRET=[Production Secret]
   MPESA_SHORTCODE=[Your Business Shortcode]
   MPESA_PASSKEY=[Production Passkey]
   MPESA_ENVIRONMENT=production
   ```

4. **Use Real Phone Numbers:**
   - Only real Kenyan Safaricom numbers work in production

---

## 🔧 Troubleshooting

### Error: "Bad Request - Invalid CallBackURL" (400.002.02) ⚠️ **YOU ARE HERE**

This means M-Pesa cannot reach your callback URL.

**Solutions:**

✅ **For Local Development:**

1. Install and run ngrok: `ngrok http 3000`
2. Copy the HTTPS URL: `https://abcd-1234.ngrok-free.app`
3. Update `.env`: `BACKEND_URL=https://abcd-1234.ngrok-free.app`
4. Restart your backend server
5. Test again

✅ **For Production:**

- Deploy backend to Render, Railway, or similar
- Use the deployment HTTPS URL
- Update `BACKEND_URL` in your environment variables

✅ **Common Fixes:**

- ❌ Don't use `http://localhost:3000` - M-Pesa can't reach it
- ❌ Don't use HTTP - Must be HTTPS
- ✅ Use ngrok HTTPS URL for testing
- ✅ Ensure callback endpoint exists: `/api/payments/mpesa/callback`

### Error: "Bad Request" (400)

- ✅ Check consumer key and secret are correct
- ✅ Verify no extra spaces in .env file
- ✅ Ensure you're using sandbox URL with sandbox credentials
- ✅ Try regenerating your app credentials on Daraja portal

### Error: "Unauthorized" (401)

- ✅ Consumer key/secret are wrong
- ✅ Regenerate credentials from Daraja portal

### Error: "Internal Server Error" (500)

- ✅ M-Pesa service might be down
- ✅ Check Safaricom status page
- ✅ Wait and retry

### STK Push Not Received

- ✅ Phone number must be registered with M-Pesa
- ✅ In sandbox, use test numbers only
- ✅ Check if callback URL is accessible
- ✅ Verify phone has network connectivity

---

## 📞 Support

- **Daraja Portal:** https://developer.safaricom.co.ke
- **Support Email:** apisupport@safaricom.co.ke
- **Documentation:** https://developer.safaricom.co.ke/Documentation

---

## ✨ After Fixing

1. Restart your backend server
2. Test with a sandbox number
3. Check backend logs for "✅ M-Pesa order created"
4. Verify STK push appears on test phone
5. Complete payment and verify order creation

Good luck! 🎉
