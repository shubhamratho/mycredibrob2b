-- Client-Side Referral Digit Generation Setup
-- Run this to clean up database triggers and prepare for client-side generation

-- 1. Drop existing problematic triggers (if they exist)
-- First drop any triggers that might exist
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Then drop functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.generate_referral_digit() CASCADE;

-- 2. Make sure referral_digit column is nullable (allows client-side assignment)
ALTER TABLE public.profiles 
ALTER COLUMN referral_digit DROP NOT NULL;

-- 3. Ensure the unique constraint exists for referral_digit (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_referral_digit_unique' 
        AND table_name = 'profiles' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_referral_digit_unique UNIQUE (referral_digit);
    END IF;
END $$;

-- 4. Create index for better performance on referral digit lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_digit 
ON public.profiles USING btree (referral_digit);

-- 5. Create public view for referral digit validation (fixes RLS issues)
CREATE OR REPLACE VIEW public.referral_validation AS
SELECT 
  id,
  name,
  referral_digit
FROM public.profiles 
WHERE referral_digit IS NOT NULL;

-- 6. Grant public access to the validation view
GRANT SELECT ON public.referral_validation TO anon;
GRANT SELECT ON public.referral_validation TO authenticated;

-- 7. Verify current table structure (using standard SQL instead of \d)
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 8. Show any existing referral digits
SELECT id, name, mobile_no, referral_digit, created_at 
FROM profiles 
WHERE referral_digit IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 9. Count total profiles and those with referral digits
SELECT 
  COUNT(*) as total_profiles,
  COUNT(referral_digit) as profiles_with_digits,
  COUNT(*) - COUNT(referral_digit) as profiles_without_digits
FROM profiles;

-- 10. Test the new referral validation view
SELECT referral_digit, name FROM public.referral_validation LIMIT 5;
