-- STEP BY STEP FIX - Run each section separately and check results
-- This ensures we can track where the issue is

-- SECTION 1: Check if the trigger function exists
SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_new_user_safe';

-- SECTION 2: Check if trigger exists
SELECT tgname, tgfoid::regproc, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- SECTION 3: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- SECTION 4: Create the digit generation function first
CREATE OR REPLACE FUNCTION generate_simple_digit()
RETURNS TEXT AS $$
BEGIN
    RETURN LPAD(((RANDOM() * 900) + 100)::INTEGER::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT generate_simple_digit() as test_digit;

-- SECTION 5: Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_safe()
RETURNS TRIGGER AS $$
DECLARE
    new_digit TEXT;
    attempts INTEGER := 0;
    digit_exists BOOLEAN;
BEGIN
    -- Log that we're in the trigger
    RAISE NOTICE 'Trigger fired for user: %', NEW.id;
    
    -- Generate a unique referral digit
    LOOP
        new_digit := generate_simple_digit();
        
        -- Check if it exists
        SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_digit = new_digit) INTO digit_exists;
        
        IF NOT digit_exists THEN
            EXIT;
        END IF;
        
        attempts := attempts + 1;
        IF attempts > 50 THEN
            -- Use timestamp-based fallback
            new_digit := LPAD((EXTRACT(EPOCH FROM NOW())::INTEGER % 900 + 100)::TEXT, 3, '0');
            EXIT;
        END IF;
    END LOOP;

    RAISE NOTICE 'Generated digit: % for user: %', new_digit, NEW.id;

    -- Create profile with referral digit
    INSERT INTO public.profiles (id, name, mobile_no, rm_name, referral_digit)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'mobile_no', ''),
        COALESCE(NEW.raw_user_meta_data->>'rm_name', ''),
        new_digit
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        mobile_no = EXCLUDED.mobile_no,
        rm_name = EXCLUDED.rm_name,
        referral_digit = COALESCE(profiles.referral_digit, new_digit);
    
    RAISE NOTICE 'Profile created for user: %', NEW.id;
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in trigger: %', SQLERRM;
        -- If anything fails, just create basic profile
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

-- SECTION 6: Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_safe();

-- SECTION 7: Verify the trigger was created
SELECT tgname, tgfoid::regproc, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- SECTION 8: Assign digits to existing users who don't have them
UPDATE profiles 
SET referral_digit = generate_simple_digit()
WHERE referral_digit IS NULL;

-- SECTION 9: Check results
SELECT id, name, referral_digit, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;
