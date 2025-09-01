-- Enhanced Admin Access with Better Status Update Support
-- Run this AFTER the main supabase-admin-access.sql file

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous read for admin" ON profiles;
DROP POLICY IF EXISTS "Allow anonymous read all referrals for admin" ON referrals;
DROP POLICY IF EXISTS "Allow anonymous update referral status for admin" ON referrals;

-- Create improved policies with better names
CREATE POLICY "admin_profiles_read" ON profiles
    FOR SELECT TO anon USING (TRUE);

CREATE POLICY "admin_referrals_read" ON referrals
    FOR SELECT TO anon USING (TRUE);

CREATE POLICY "admin_referrals_update" ON referrals
    FOR UPDATE TO anon 
    USING (TRUE)
    WITH CHECK (TRUE);

-- Ensure the rm_name column exists in profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS rm_name TEXT NOT NULL DEFAULT '';

-- Update the handle_new_user function to include rm_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, mobile_no, rm_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'mobile_no', ''),
        COALESCE(NEW.raw_user_meta_data->>'rm_name', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        mobile_no = EXCLUDED.mobile_no,
        rm_name = EXCLUDED.rm_name;
    RETURN NEW;
END;    
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an index for rm_name if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_rm_name ON profiles(rm_name);

-- Verify permissions
GRANT SELECT ON profiles TO anon;
GRANT SELECT, UPDATE ON referrals TO anon;
