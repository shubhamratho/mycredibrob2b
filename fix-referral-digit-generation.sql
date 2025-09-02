-- SIMPLE FIX for referral digit not being generated during signup
-- Run this in Supabase SQL Editor

-- Drop the existing trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a much simpler referral digit generation function
CREATE OR REPLACE FUNCTION generate_simple_referral_digit()
RETURNS TEXT AS $$
BEGIN
    -- Generate a simple 3-digit code based on current timestamp and random number
    RETURN LPAD(((EXTRACT(EPOCH FROM NOW())::INTEGER + RANDOM() * 1000)::INTEGER % 900 + 100)::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Create a simplified trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, mobile_no, rm_name, referral_digit)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'mobile_no', ''),
        COALESCE(NEW.raw_user_meta_data->>'rm_name', ''),
        generate_simple_referral_digit()
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        mobile_no = EXCLUDED.mobile_no,
        rm_name = EXCLUDED.rm_name,
        referral_digit = COALESCE(profiles.referral_digit, generate_simple_referral_digit());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing users who don't have referral digits
UPDATE profiles 
SET referral_digit = generate_simple_referral_digit() 
WHERE referral_digit IS NULL;

-- Test the function (this will show you a sample generated digit)
SELECT 'Sample generated digit: ' || generate_simple_referral_digit() as test_output;
