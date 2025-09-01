-- Migration Update: Add RM Name field to profiles table
-- Run this SQL in your Supabase SQL editor to add the RM name column

-- Add rm_name column to profiles table
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

-- If you want to add a constraint to ensure RM names are in uppercase (optional)
-- ALTER TABLE profiles 
-- ADD CONSTRAINT rm_name_uppercase_check 
-- CHECK (rm_name = UPPER(rm_name));

-- Create an index for better performance on RM name searches
CREATE INDEX IF NOT EXISTS idx_profiles_rm_name ON profiles(rm_name);

-- Grant necessary permissions (already handled in main migration, but included for completeness)
GRANT ALL ON profiles TO authenticated;
