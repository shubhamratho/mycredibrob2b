-- Migration: Create mycredibro-b2b database schema (Updated with RM Name)
-- This file should be run in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table with RM name field
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    mobile_no TEXT NOT NULL,
    rm_name TEXT NOT NULL DEFAULT '',
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    mobile_no TEXT NOT NULL,
    residency_pincode TEXT NOT NULL,
    employment_type TEXT CHECK (employment_type IN ('salaried', 'self-employed')) NOT NULL,
    employer_name TEXT,
    monthly_net_income NUMERIC NOT NULL,
    terms_accepted_at TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('InProgress', 'Approved', 'Decline')) DEFAULT 'InProgress',
    processed_by UUID REFERENCES profiles(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user_id ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_mobile_no ON profiles(mobile_no);
CREATE INDEX IF NOT EXISTS idx_profiles_rm_name ON profiles(rm_name);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Referrals RLS Policies
CREATE POLICY "Anyone can insert referrals" ON referrals
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can view their own referrals" ON referrals
    FOR SELECT USING (referrer_user_id = auth.uid());

CREATE POLICY "Admins can view all referrals" ON referrals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can update referral status" ON referrals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Function to mask mobile numbers
CREATE OR REPLACE FUNCTION mask_mobile(mobile_no TEXT)
RETURNS TEXT AS $$
BEGIN
    IF LENGTH(mobile_no) >= 6 THEN
        RETURN SUBSTRING(mobile_no FROM 1 FOR 2) || 'xxxxx' || SUBSTRING(mobile_no FROM LENGTH(mobile_no)-2);
    ELSE
        RETURN 'xxxxx';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a view for masked referrals for non-admin users
CREATE OR REPLACE VIEW referrals_masked AS
SELECT 
    id,
    referrer_user_id,
    name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        ) THEN mobile_no
        ELSE mask_mobile(mobile_no)
    END as mobile_no,
    residency_pincode,
    employment_type,
    employer_name,
    monthly_net_income,
    terms_accepted_at,
    status,
    processed_by,
    processed_at,
    created_at
FROM referrals;

-- Grant necessary permissions
GRANT SELECT ON referrals_masked TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON referrals TO authenticated;

-- Function to handle new user profile creation (updated with RM name)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, mobile_no, rm_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'mobile_no', ''),
        COALESCE(NEW.raw_user_meta_data->>'rm_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optional: Add constraint to ensure RM names are in uppercase
-- Uncomment the following line if you want to enforce uppercase at database level
-- ALTER TABLE profiles 
-- ADD CONSTRAINT rm_name_uppercase_check 
-- CHECK (rm_name = UPPER(rm_name));
