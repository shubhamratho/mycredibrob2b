-- Instructions for creating an admin user

-- Method 1: Using Supabase Dashboard
-- 1. Go to your Supabase dashboard -> Authentication -> Users
-- 2. Click "Add user" and create a new user with email/password
-- 3. Copy the user ID
-- 4. Go to Table Editor -> profiles table
-- 5. Find the user's row and set is_admin = true

-- Method 2: Using SQL (after user signup)
-- Replace 'admin@example.com' with the actual admin email
UPDATE profiles 
SET is_admin = true 
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'admin@example.com'
);

-- Method 3: Create admin user programmatically (if needed)
-- First, the user needs to sign up normally through your app
-- Then run this query to make them admin:

-- Example:
-- UPDATE profiles SET is_admin = true WHERE email = 'your-admin@email.com';

-- To check current admin users:
SELECT u.email, p.is_admin 
FROM auth.users u 
JOIN profiles p ON u.id = p.id 
WHERE p.is_admin = true;
