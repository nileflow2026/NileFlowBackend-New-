# OAuth Backend Setup Guide

The frontend is now ready for OAuth authentication with Google and Facebook. You need to implement these backend endpoints:

## Required Backend Endpoints

### 1. Google OAuth Initiation

**GET** `/api/customerauth/oauth/google`

This endpoint should:

- Generate the Google OAuth authorization URL
- Include your redirect URI (e.g., `https://yourdomain.com/api/customerauth/oauth/google/callback`)
- Return: `{ authUrl: "https://accounts.google.com/o/oauth2/v2/auth?..." }`

Example implementation:

```javascript
router.get("/oauth/google", (req, res) => {
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}` +
    `&response_type=code` +
    `&scope=openid email profile`;

  res.json({ authUrl });
});
```

### 2. Google OAuth Callback

**GET** `/api/customerauth/oauth/google/callback`

This endpoint should:

- Receive the authorization code from Google
- Exchange it for access token
- Fetch user profile from Google
- Create or update user in your database
- Generate JWT tokens for your app
- Redirect to frontend with tokens (or use a different flow)

### 3. Facebook OAuth Initiation

**GET** `/api/customerauth/oauth/facebook`

Similar to Google, but for Facebook:

```javascript
router.get("/oauth/facebook", (req, res) => {
  const authUrl =
    `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${process.env.FACEBOOK_APP_ID}` +
    `&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}` +
    `&scope=email,public_profile`;

  res.json({ authUrl });
});
```

### 4. Facebook OAuth Callback

**GET** `/api/customerauth/oauth/facebook/callback`

Similar to Google callback, but exchange code with Facebook.

## Environment Variables Needed

Add these to your backend `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/customerauth/oauth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=https://yourdomain.com/api/customerauth/oauth/facebook/callback

# Your app's frontend URL for final redirect
FRONTEND_URL=https://yourdomain.com
```

## Setup Steps

### Google OAuth Setup:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Copy Client ID and Client Secret

### Facebook OAuth Setup:

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs
5. Copy App ID and App Secret

## Token Flow

After OAuth callback:

1. Backend creates/updates user
2. Generates JWT access token and refresh token
3. Options for token delivery:
   - **Option A**: Redirect to frontend with tokens in URL query params
   - **Option B**: Set HTTP-only cookies
   - **Option C**: Return tokens via API and use window.opener.postMessage

Recommended: Option A for simplicity

```javascript
res.redirect(
  `${process.env.FRONTEND_URL}/oauth/callback?token=${accessToken}&refreshToken=${refreshToken}`
);
```

Then create a frontend route to handle this callback and store tokens.

## Security Considerations

- Always use HTTPS in production
- Validate state parameter to prevent CSRF
- Store client secrets securely (never in frontend)
- Set appropriate token expiration times
- Use HTTP-only cookies for tokens when possible

## Testing

1. Test Google OAuth flow manually
2. Test Facebook OAuth flow manually
3. Verify user creation/update in database
4. Verify token generation and validation
5. Test error scenarios (denied permission, invalid code, etc.)
