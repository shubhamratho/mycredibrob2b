-- Manual assignment of referral digits for existing users
-- Run this if users still don't have referral digits after signup

-- First, let's see who doesn't have referral digits
SELECT id, name, referral_digit FROM profiles WHERE referral_digit IS NULL;

-- Manually assign referral digits to users who don't have them
DO $$
DECLARE
    user_record RECORD;
    new_digit TEXT;
    digit_exists BOOLEAN;
    attempts INTEGER;
BEGIN
    FOR user_record IN SELECT id, name FROM profiles WHERE referral_digit IS NULL LOOP
        attempts := 0;
        
        LOOP
            -- Generate a new digit
            new_digit := LPAD(((EXTRACT(EPOCH FROM NOW())::INTEGER + RANDOM() * 1000 + attempts)::INTEGER % 900 + 100)::TEXT, 3, '0');
            
            -- Check if it exists
            SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_digit = new_digit) INTO digit_exists;
            
            IF NOT digit_exists THEN
                -- Update the user with this digit
                UPDATE profiles SET referral_digit = new_digit WHERE id = user_record.id;
                RAISE NOTICE 'Assigned digit % to user %', new_digit, user_record.name;
                EXIT;
            END IF;
            
            attempts := attempts + 1;
            IF attempts > 100 THEN
                -- Fallback: use user ID
                new_digit := RIGHT(user_record.id::TEXT, 3);
                UPDATE profiles SET referral_digit = new_digit WHERE id = user_record.id;
                RAISE NOTICE 'Assigned fallback digit % to user %', new_digit, user_record.name;
                EXIT;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Verify all users now have referral digits
SELECT 
    COUNT(*) as total_users,
    COUNT(referral_digit) as users_with_digits,
    COUNT(*) - COUNT(referral_digit) as users_without_digits
FROM profiles;
