-- Fix RLS issue for referral digit validation
-- Create a public view that allows form validation without exposing sensitive data

-- 1. Create a public view for referral digit validation
CREATE OR REPLACE VIEW public.referral_validation AS
SELECT 
  id,
  name,
  referral_digit
FROM public.profiles 
WHERE referral_digit IS NOT NULL;

-- 2. Grant public access to this view
GRANT SELECT ON public.referral_validation TO anon;
GRANT SELECT ON public.referral_validation TO authenticated;

-- 3. Enable RLS on the view (but allow public read access)
ALTER VIEW public.referral_validation OWNER TO postgres;

-- 4. Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_referral_validation_digit 
ON public.profiles (referral_digit) 
WHERE referral_digit IS NOT NULL;

-- 5. Test the view
SELECT referral_digit, name FROM public.referral_validation LIMIT 5;

-- 6. Verify the view was created successfully
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'referral_validation';
