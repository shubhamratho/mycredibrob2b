# Admin Dashboard Setup Guide

## Overview
The admin dashboard is accessible at `/admin` with password protection and provides comprehensive management of all referrals.

## 🔐 Security Features

### Password Protection
- **Default Password**: `admin123`
- **Custom Password**: Set `NEXT_PUBLIC_ADMIN_PASSWORD` in your `.env.local` file
- **Session Management**: Authentication persists until browser session ends
- **Auto-logout**: Sign out button to clear session

### Access Control
- Login required before accessing any admin features
- Session-based authentication with browser storage
- Password validation with error handling
- Secure logout functionality

## Features

### 📊 Dashboard Statistics
- **Total Referrals**: Count of all submitted referrals
- **In Progress**: Referrals awaiting review
- **Approved**: Successfully approved referrals  
- **Declined**: Rejected referrals

### 📋 Complete Referral Management
The admin can view all referral data including:
- **Customer Information**: Name, mobile number, pincode
- **Employment Details**: Type (salaried/self-employed), employer, income
- **Referrer Information**: Name, mobile, RM name
- **Status Management**: ✅ **Real-time editable status dropdown**
- **Timestamps**: Submission and processing dates

### 🔒 Data Privacy Features
- **Toggle Sensitive Data**: Show/hide full mobile numbers
- **Mobile Masking**: Automatically masks phone numbers (XX***XX)
- **Secure Display**: Protects customer information

### 🎯 Enhanced Admin Functions
- **✅ Real-time Status Updates**: Changes save immediately to database
- **Success Notifications**: Visual feedback when status changes
- **Error Handling**: Detailed error messages and retry options
- **Filtering**: Filter referrals by status
- **Manual Refresh**: Reload latest data
- **Audit Trail**: Logs status changes with timestamps

## Database Setup

### 1. Run the Main Migration
First, ensure you have the basic tables:
\`\`\`sql
-- Run supabase-migration.sql or supabase-migration-complete-updated.sql
\`\`\`

### 2. Run the Enhanced Admin Access SQL
Execute the following SQL in your Supabase SQL Editor:
\`\`\`sql
-- From supabase-admin-enhanced.sql
-- This provides better security and status update functionality
\`\`\`

### 3. Required Environment Variables
Add to your \`.env.local\` file:
\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password
\`\`\`

## Access & Usage

### URL & Login
- **Admin Dashboard**: \`http://localhost:3000/admin\`
- **Login Required**: Enter admin password to access
- **Default Password**: \`admin123\` (change in production!)

### Managing Referrals
1. **Login**: Enter admin password at \`/admin\`
2. **View Statistics**: See real-time counts in dashboard cards
3. **Browse Referrals**: All submissions displayed in the table
4. **Filter Data**: Use status dropdown to filter referrals
5. **Update Status**: 
   - Click any status dropdown in the "Status" column
   - Select new status (In Progress/Approved/Declined)
   - ✅ **Changes save automatically to database**
   - See success notification
6. **Privacy Control**: Toggle "Show Full Data" to view complete mobile numbers

### Status Management Features
- **Instant Updates**: Status changes immediately in database
- **Visual Feedback**: Success notifications show confirmation
- **Error Handling**: Clear error messages if update fails
- **Real-time Stats**: Dashboard counts update automatically
- **Audit Trail**: Processed timestamps track when changes were made

## 🔧 Troubleshooting

### Status Updates Not Working
1. **Check Database Permissions**: Run \`supabase-admin-enhanced.sql\`
2. **Verify Anonymous Access**: Ensure anon role has UPDATE permissions on referrals
3. **Check Browser Console**: Look for error messages
4. **Test Connection**: Use "Refresh" button to verify database connectivity

### Login Issues
1. **Wrong Password**: Check \`NEXT_PUBLIC_ADMIN_PASSWORD\` in \`.env.local\`
2. **Environment Variables**: Restart development server after changing \`.env.local\`
3. **Session Problems**: Clear browser storage and try again

### Data Not Loading
1. **Database Migration**: Ensure all SQL files have been executed
2. **Permissions**: Verify anonymous read access to profiles and referrals tables
3. **RM Name Column**: Make sure \`rm_name\` column exists in profiles table

## 🚀 Production Security

### Recommended Security Measures
1. **Strong Password**: Use a complex admin password
2. **Environment Variables**: Never commit passwords to code
3. **HTTPS Only**: Ensure SSL/TLS in production
4. **IP Whitelisting**: Restrict admin access to specific IPs
5. **VPN Access**: Place behind corporate VPN
6. **Audit Logging**: Monitor admin access and changes
7. **Regular Rotation**: Change admin password periodically

### Environment Setup
\`\`\`bash
# Production .env.local
NEXT_PUBLIC_ADMIN_PASSWORD=your-very-secure-password-here
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-supabase-key
\`\`\`

## Files Overview
- \`/src/app/admin/page.tsx\` - Secure admin dashboard with authentication
- \`supabase-admin-enhanced.sql\` - Enhanced database permissions and policies
- \`supabase-migration-update.sql\` - RM name column addition
- \`.env.example\` - Environment variables template

## ✅ What's Fixed
1. **🔐 Security**: Password protection added
2. **💾 Database Updates**: Status changes now save properly to database
3. **🔄 Real-time Updates**: Immediate feedback and statistics refresh
4. **🛡️ Error Handling**: Better error messages and retry functionality
5. **📱 User Experience**: Success notifications and loading states

The admin dashboard is now secure and fully functional with real-time database updates! 🚀
