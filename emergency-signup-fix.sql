-- EMERGENCY FIX: Run this to fix the signup issue
-- The problem is referral_digit is NOT NULL but has no default value

-- First, make referral_digit nullable temporarily to allow signups
ALTER TABLE profiles 
ALTER COLUMN referral_digit DROP NOT NULL;

-- Ensure the column exists (safe if already exists)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_digit VARCHAR(3);

-- Add the column to referrals table too (safe if already exists)
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS referral_digit VARCHAR(3);

-- Drop the unique constraint temporarily if it exists to avoid conflicts
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_referral_digit_key;

-- Create a simple function to generate 3-digit codes
CREATE OR REPLACE FUNCTION generate_referral_digit()
RETURNS TEXT AS $$
DECLARE
    digit_code TEXT;
    exists_check BOOLEAN;
    attempts INTEGER := 0;
BEGIN
    LOOP
        -- Generate a random 3-digit number (100-999)
        digit_code := LPAD((RANDOM() * 900 + 100)::INTEGER::TEXT, 3, '0');
        
        -- Check if this digit already exists
        SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_digit = digit_code) INTO exists_check;
        
        -- If it doesn't exist, break the loop
        IF NOT exists_check THEN
            EXIT;
        END IF;
        
        -- Safety check to prevent infinite loops
        attempts := attempts + 1;
        IF attempts > 1000 THEN
            -- If we can't find a unique code after 1000 attempts, use timestamp-based code
            digit_code := LPAD((EXTRACT(EPOCH FROM NOW())::INTEGER % 900 + 100)::TEXT, 3, '0');
            EXIT;
        END IF;
    END LOOP;
    
    RETURN digit_code;
END;
$$ LANGUAGE plpgsql;

-- Update the handle_new_user function to work with the current schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    generated_digit TEXT;
BEGIN
    -- Try to generate a referral digit
    BEGIN
        generated_digit := generate_referral_digit();
    EXCEPTION
        WHEN OTHERS THEN
            -- If generation fails, we'll update it later
            generated_digit := NULL;
    END;

    INSERT INTO public.profiles (id, name, mobile_no, rm_name, referral_digit)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'mobile_no', ''),
        COALESCE(NEW.raw_user_meta_data->>'rm_name', ''),
        generated_digit
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        mobile_no = EXCLUDED.mobile_no,
        rm_name = EXCLUDED.rm_name,
        referral_digit = COALESCE(profiles.referral_digit, generated_digit);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing users who don't have referral digits
UPDATE profiles 
SET referral_digit = generate_referral_digit() 
WHERE referral_digit IS NULL OR referral_digit = '';

-- Now add the unique constraint back (only after all users have digits)
ALTER TABLE profiles 
ADD CONSTRAINT profiles_referral_digit_unique UNIQUE (referral_digit);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_referral_digit ON profiles(referral_digit);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_digit ON referrals(referral_digit);
