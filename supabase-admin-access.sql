-- Admin Access Update: Add permissions for admin page access
-- Run this SQL in your Supabase SQL editor to enable admin access

-- Create a function to allow anonymous access to referrals for admin page
-- This enables the admin page to work without authentication

-- Grant SELECT permission on profiles to anonymous users (for admin page only)
GRANT SELECT ON profiles TO anon;

-- Grant SELECT and UPDATE permission on referrals to anonymous users (for admin page)
GRANT SELECT, UPDATE ON referrals TO anon;

-- Create a more permissive policy for admin access
-- Note: This should only be used if you want the admin page to be publicly accessible
-- For production, consider implementing proper admin authentication

-- Policy to allow anonymous access to view all profiles (for admin page)
CREATE POLICY "Allow anonymous read for admin" ON profiles
    FOR SELECT TO anon USING (TRUE);

-- Policy to allow anonymous access to view all referrals (for admin page)
CREATE POLICY "Allow anonymous read all referrals for admin" ON referrals
    FOR SELECT TO anon USING (TRUE);

-- Policy to allow anonymous update of referral status (for admin page)
CREATE POLICY "Allow anonymous update referral status for admin" ON referrals
    FOR UPDATE TO anon USING (TRUE)
    WITH CHECK (TRUE);

-- Alternative: If you want to restrict admin access to specific conditions,
-- uncomment and modify the following policies instead:

-- Policy to allow admin access only from specific conditions
-- CREATE POLICY "Admin access with conditions" ON referrals
--     FOR ALL TO anon 
--     USING (
--         -- Add your conditions here, for example:
--         -- Check if request comes from admin IP or has specific header
--         TRUE  -- Replace with actual conditions
--     );

-- Create an admin view that shows all referral data with referrer information
CREATE OR REPLACE VIEW admin_referrals_view AS
SELECT 
    r.id,
    r.referrer_user_id,
    r.name,
    r.mobile_no,
    r.residency_pincode,
    r.employment_type,
    r.employer_name,
    r.monthly_net_income,
    r.terms_accepted_at,
    r.status,
    r.processed_by,
    r.processed_at,
    r.created_at,
    p.name as referrer_name,
    p.mobile_no as referrer_mobile,
    p.rm_name as referrer_rm_name
FROM referrals r
LEFT JOIN profiles p ON r.referrer_user_id = p.id
ORDER BY r.created_at DESC;

-- Grant access to the admin view
GRANT SELECT ON admin_referrals_view TO anon;
GRANT SELECT ON admin_referrals_view TO authenticated;

-- Create indexes for better performance on admin queries
CREATE INDEX IF NOT EXISTS idx_referrals_created_at_desc ON referrals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_status_created_at ON referrals(status, created_at DESC);

-- Security Note:
-- The above policies allow anonymous access to the referrals data.
-- This is intentional for the admin page functionality as requested.
-- In a production environment, consider:
-- 1. Implementing proper admin authentication
-- 2. Using IP whitelisting
-- 3. Adding additional security layers
-- 4. Using environment-specific policies
