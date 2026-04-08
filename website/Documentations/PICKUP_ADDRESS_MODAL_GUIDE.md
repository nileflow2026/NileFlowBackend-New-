# Mandatory Pickup Address Modal

## Overview

This implementation adds a mandatory pickup address modal that appears after users successfully complete account verification during signup. The modal cannot be dismissed until the user provides their pickup address and phone number for delivery tracking.

## Components Created/Modified

### 1. PickupAddressModal Component (`/components/PickupAddressModal.jsx`)

- **Purpose**: A modal dialog that collects pickup address and phone number
- **Features**:
  - Form validation for required fields
  - Phone number format validation
  - Beautiful UI with gradient backgrounds matching your site theme
  - Success animation after submission
  - Non-dismissible (no close button or escape functionality)
  - Required fields: Street Address, Phone Number, City, State/Province
  - Optional field: Postal Code

### 2. CustomerAuthContext Updates (`/Context/CustomerAuthContext.jsx`)

- Added `showPickupModal` state to track modal visibility
- Added `setPickupModalVisible` function to control modal display
- Enhanced sign-in methods to check for pickup address requirement
- Added `needsPickupAddress` flag to authentication responses
- Modal state is available globally across the application

### 3. Signup Page Updates (`/src/Pages/Signup.jsx`)

- Removed pickup modal functionality from signup flow
- Verification success now redirects normally to sign-in page
- Cleaner signup process focused on account creation only

### 4. SignIn Page Updates (`/src/Pages/SignIn.jsx`)

- Added pickup modal integration to sign-in flow
- Added `handlePickupAddressSubmit` function to process form data
- Modified all sign-in methods (email/password, Google, Facebook) to check for pickup address
- Shows modal automatically after successful authentication if user lacks pickup address

### 5. App Component Updates (`/src/App.jsx`)

- Added global pickup address modal that can be triggered from anywhere in the app
- Created separate `AppContent` component to use authentication hooks
- Modal is available site-wide for future enhancements

### 6. API Integration (`/authServices.js`)

- Added `savePickupAddress` function for backend API calls
- Endpoint: `POST /api/customerauth/pickup-address`
- Handles success/error responses

## User Flow

1. **User Signs Up**: User creates account with email, password, username, and phone
2. **Email Verification**: User receives verification code via email
3. **Account Verification**: User enters 6-digit code to verify account
4. **Redirect to Sign-In**: After successful verification, user is redirected to sign-in page
5. **User Signs In**: User logs in with their credentials
6. **Mandatory Modal Check**: After successful sign-in, system checks if user has pickup address
7. **Address Collection**: If no pickup address exists, modal appears and user must fill in:
   - Street address (required)
   - Phone number (required)
   - City (required)
   - State/Province (required)
   - Postal code (optional)
8. **Form Validation**: All required fields must be completed with proper formatting
9. **Submission**: Address data is sent to backend API
10. **Success**: Modal shows success message and redirects to home page
11. **Error Handling**: If API fails, user sees error message and can retry

- **Non-dismissible**: No close button, cannot be closed by clicking outside or pressing escape
- **Form validation**: Real-time validation with error messages
- **Responsive design**: Works on all screen sizes
- **Loading states**: Shows spinner during submission
- **Success animation**: Displays confirmation message after successful save

### Error Handling

- Form validation errors display inline
- API errors show toast notifications
- Network errors are caught and displayed to user
- Validation clears as user types

### Security & UX

- Phone number regex validation for proper formatting
- All inputs are sanitized
- Form cannot be submitted with invalid data
- User-friendly error messages
- Consistent with site's design theme

## Backend Integration Required

You'll need to implement the backend endpoint:

```javascript
POST / api / customerauth / pickup - address;
```

**Request Body:**

```json
{
  "address": "123 Main Street",
  "phone": "+1234567890",
  "city": "City Name",
  "state": "State/Province",
  "postalCode": "12345"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Pickup address saved successfully",
  "data": {
    "addressId": "12345",
    "userId": "user123"
  }
}
```

## Testing the Implementation

1. **Enable the App**: Set `APP_IS_DOWN = false` in `/src/App.jsx` line 51
2. **Complete Signup Flow**:
   - Go to `/signup`
   - Create new account
   - Verify email with code
   - Modal should appear automatically
3. **Test Form Validation**:
   - Try submitting with empty fields
   - Test invalid phone number formats
   - Verify required field validation
4. **Test Success Flow**:
   - Fill all required fields
   - Submit form
   - Should see success message and redirect

## Future Enhancements

The modal system is designed to be flexible and can be enhanced with:

- **Address Autocomplete**: Integration with Google Places API
- **Map Integration**: Allow users to select address on map
- **Multiple Addresses**: Support for multiple pickup locations
- **Address Validation**: Verify addresses against postal service APIs
- **Edit Mode**: Allow users to update address later from profile page

## Configuration Options

The modal can be customized by modifying:

- **Styling**: Update Tailwind classes in `PickupAddressModal.jsx`
- **Validation Rules**: Modify regex patterns and validation logic
- **Required Fields**: Change which fields are required vs optional
- **Redirect Behavior**: Customize where users go after completion

This implementation ensures users cannot skip providing essential delivery information while maintaining a smooth, user-friendly experience.
