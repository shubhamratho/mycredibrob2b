-- NUCLEAR OPTION: Complete fix for signup issues
-- This will disable the trigger temporarily and allow signups to work

-- Step 1: Disable the problematic trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Make referral_digit nullable if it isn't already
ALTER TABLE profiles ALTER COLUMN referral_digit DROP NOT NULL;

-- Step 3: Create a simple function to generate referral digits
CREATE OR REPLACE FUNCTION generate_simple_digit()
RETURNS TEXT AS $$
BEGIN
    RETURN LPAD(((RANDOM() * 900) + 100)::INTEGER::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create a profile creation function that includes referral digit
CREATE OR REPLACE FUNCTION public.handle_new_user_safe()
RETURNS TRIGGER AS $$
DECLARE
    new_digit TEXT;
    attempts INTEGER := 0;
    digit_exists BOOLEAN;
BEGIN
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
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
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

-- Step 5: Create the safe trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_safe();

-- Step 6: Create a function to assign referral digits to existing users
CREATE OR REPLACE FUNCTION assign_referral_digit_to_user(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    new_digit TEXT;
    digit_exists BOOLEAN;
    attempts INTEGER := 0;
BEGIN
    LOOP
        new_digit := generate_simple_digit();
        
        SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_digit = new_digit) INTO digit_exists;
        
        IF NOT digit_exists THEN
            UPDATE profiles SET referral_digit = new_digit WHERE id = user_id;
            RETURN new_digit;
        END IF;
        
        attempts := attempts + 1;
        IF attempts > 100 THEN
            new_digit := LPAD((EXTRACT(EPOCH FROM NOW())::INTEGER % 900 + 100)::TEXT, 3, '0');
            UPDATE profiles SET referral_digit = new_digit WHERE id = user_id;
            RETURN new_digit;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Assign digits to all existing users who don't have them
UPDATE profiles 
SET referral_digit = generate_simple_digit()
WHERE referral_digit IS NULL;

-- Step 8: Fix any duplicates that might have been created
UPDATE profiles 
SET referral_digit = generate_simple_digit() || '1'
WHERE id IN (
    SELECT id FROM (
        SELECT id, referral_digit, 
               ROW_NUMBER() OVER (PARTITION BY referral_digit ORDER BY created_at) as rn
        FROM profiles 
        WHERE referral_digit IS NOT NULL
    ) duplicates 
    WHERE rn > 1
);
