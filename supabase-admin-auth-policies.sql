-- Updated RLS policies for admin authentication using is_admin column

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can read all referrals" ON referrals;
DROP POLICY IF EXISTS "Admin can update referral status" ON referrals;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;

-- Create new admin policies using is_admin column from profiles table
CREATE POLICY "Admin can read all referrals" ON referrals
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    )
);

CREATE POLICY "Admin can update referral status" ON referrals
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    )
);

CREATE POLICY "Admin can read all profiles" ON profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    )
);

-- Allow users to read their own profile (for is_admin check)
CREATE POLICY "Users can read own profile" ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Ensure processed_by column can be updated by admins
ALTER TABLE referrals ALTER COLUMN processed_by DROP NOT NULL;

-- Create a sample admin user function (optional)
CREATE OR REPLACE FUNCTION make_user_admin(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = user_email;
    UPDATE profiles SET is_admin = true WHERE id = (
        SELECT id FROM auth.users WHERE email = user_email
    );
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;
