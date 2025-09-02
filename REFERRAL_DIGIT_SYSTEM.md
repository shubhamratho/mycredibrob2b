# Referral Digit System Documentation

## Overview
The MyCredibro B2B platform now supports a dual referral tracking system:
1. **URL/QR Code System** - Existing automatic tracking via unique URLs
2. **Referral Digit System** - New 3-digit manual referral codes

## Features Added

### 1. Automatic Referral Digit Generation
- Every new user gets a unique 3-digit referral code (100-999)
- Codes are automatically generated during signup
- Stored in `profiles.referral_digit` column
- Guaranteed uniqueness through database constraints

### 2. Dashboard Display
- Referral digit prominently displayed on user dashboard
- Shown alongside existing QR code and referral link
- Easy copying for manual sharing

### 3. Application Form Enhancement
- Optional referral digit field added to application form
- Real-time validation (3 digits only)
- Customers can enter referral digit manually
- Works alongside existing URL-based referrals

### 4. Form Validation Improvements
- **Mobile Number**: Exactly 10 digits, must start with 6-9
- **Pincode**: Exactly 6 digits
- **Referral Digit**: Optional, exactly 3 digits if provided
- Real-time validation feedback with error messages

### 5. Admin Panel Updates
- New columns showing referrer's digit and customer's entered digit
- Badge display for easy identification
- Tracks both URL-based and digit-based referrals

## How It Works

### For Referrers (Users)
1. Sign up and get assigned a unique 3-digit code
2. Share either:
   - QR code/URL (automatic tracking)
   - 3-digit code (manual entry by customer)
3. View code on dashboard for easy sharing

### For Customers
1. Access application via URL/QR (automatic) OR
2. Visit universal application form and enter 3-digit code manually
3. Both methods properly track the referrer

### For Admins
- View all referrals with complete tracking information
- See which method was used (URL vs manual digit)
- Comprehensive referral analytics

## Database Changes

### New Fields Added:
- `profiles.referral_digit` - User's unique 3-digit code
- `referrals.referral_digit` - Customer's entered referral digit

### New Functions:
- `generate_referral_digit()` - Creates unique 3-digit codes
- Updated `handle_new_user()` - Includes referral digit generation

## Usage Examples

### Referrer Sharing Options:
1. **QR Code**: "Scan this QR code to apply"
2. **URL**: "Visit mysite.com/r/[user-id] to apply"
3. **Digit**: "Use referral code 123 when applying"

### Customer Application:
1. **Direct**: Click referral link → Auto-fills referrer info
2. **Manual**: Go to application form → Enter code 123 → Tracks referrer

## Benefits

### For Business:
- Increased referral tracking accuracy
- Multiple touchpoint options
- Better user experience
- Comprehensive analytics

### For Users:
- Easy sharing via simple 3-digit codes
- No need for complex URLs in verbal communication
- Maintains existing QR/URL functionality

### For Customers:
- Flexible application methods
- Simple code entry option
- Improved form validation

## Technical Implementation

### Validation Rules:
```javascript
// Mobile: 10 digits, starts with 6-9
/^[6-9]\d{9}$/

// Pincode: exactly 6 digits
/^\d{6}$/

// Referral Digit: exactly 3 digits (optional)
/^\d{3}$|^$/
```

### Database Migration:
Run `referral-digit-migration.sql` to add the new functionality to existing installations.

## Migration Notes

### For Existing Users:
- All existing users will be assigned unique referral digits
- No changes to existing referral links or QR codes
- Backward compatibility maintained

### For Existing Referrals:
- Historical referrals remain unchanged
- New referrals can use either system
- Admin panel shows both tracking methods

## Best Practices

### For Referrers:
1. Use QR codes for digital sharing
2. Use 3-digit codes for verbal/phone communication
3. Always provide clear instructions to customers

### For Customer Service:
1. Help customers choose appropriate application method
2. Verify referral codes when customers call
3. Guide customers through form validation

### For Admins:
1. Monitor both referral channels
2. Analyze effectiveness of different methods
3. Use comprehensive reporting for insights
