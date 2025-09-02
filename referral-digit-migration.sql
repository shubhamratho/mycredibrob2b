-- Migration: Add Referral Digit System
-- Run this SQL in your Supabase SQL editor

-- Add referral_digit column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_digit VARCHAR(3) UNIQUE;

-- Create a function to generate unique 3-digit referral codes
CREATE OR REPLACE FUNCTION generate_referral_digit()
RETURNS TEXT AS $$
DECLARE
    digit_code TEXT;
    exists_check BOOLEAN;
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
    END LOOP;
    
    RETURN digit_code;
END;
$$ LANGUAGE plpgsql;

-- Update the handle_new_user function to include referral_digit generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, mobile_no, rm_name, referral_digit)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'mobile_no', ''),
        COALESCE(NEW.raw_user_meta_data->>'rm_name', ''),
        generate_referral_digit()
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        mobile_no = EXCLUDED.mobile_no,
        rm_name = EXCLUDED.rm_name,
        referral_digit = COALESCE(profiles.referral_digit, generate_referral_digit());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add referral_digit field to referrals table for tracking
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS referral_digit VARCHAR(3);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_referral_digit ON profiles(referral_digit);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_digit ON referrals(referral_digit);

-- Update existing users who don't have referral digits
UPDATE profiles 
SET referral_digit = generate_referral_digit() 
WHERE referral_digit IS NULL;

-- Make referral_digit NOT NULL after updating existing records
ALTER TABLE profiles 
ALTER COLUMN referral_digit SET NOT NULL;
