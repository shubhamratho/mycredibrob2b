-- MANUAL APPROACH: If trigger doesn't work, run this after each signup
-- Replace 'USER_ID_HERE' with the actual user ID from auth.users

-- Check current users without referral digits
SELECT u.id, u.email, p.referral_digit, u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.referral_digit IS NULL
ORDER BY u.created_at DESC;

-- Manually assign referral digit to a specific user
-- UPDATE profiles 
-- SET referral_digit = LPAD(((RANDOM() * 900) + 100)::INTEGER::TEXT, 3, '0')
-- WHERE id = 'USER_ID_HERE';

-- Assign digits to ALL users who don't have them
DO $$
DECLARE
    user_record RECORD;
    new_digit TEXT;
    digit_exists BOOLEAN;
    attempts INTEGER;
BEGIN
    FOR user_record IN 
        SELECT p.id, p.name 
        FROM profiles p 
        WHERE p.referral_digit IS NULL 
    LOOP
        attempts := 0;
        
        LOOP
            -- Generate digit
            new_digit := LPAD(((RANDOM() * 900) + 100)::INTEGER::TEXT, 3, '0');
            
            -- Check if exists
            SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_digit = new_digit) INTO digit_exists;
            
            IF NOT digit_exists THEN
                -- Update user
                UPDATE profiles 
                SET referral_digit = new_digit 
                WHERE id = user_record.id;
                
                RAISE NOTICE 'Assigned digit % to user %', new_digit, user_record.name;
                EXIT;
            END IF;
            
            attempts := attempts + 1;
            IF attempts > 100 THEN
                -- Fallback
                new_digit := LPAD((EXTRACT(EPOCH FROM NOW())::INTEGER % 900 + 100)::TEXT, 3, '0');
                UPDATE profiles 
                SET referral_digit = new_digit 
                WHERE id = user_record.id;
                RAISE NOTICE 'Assigned fallback digit % to user %', new_digit, user_record.name;
                EXIT;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Verify all users now have digits
SELECT 
    COUNT(*) as total_profiles,
    COUNT(referral_digit) as profiles_with_digits,
    COUNT(*) - COUNT(referral_digit) as profiles_without_digits
FROM profiles;
