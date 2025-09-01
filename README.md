# MyCredibro B2B - Loan Referral Platform

A complete Next.js 14 web application built with Supabase, TailwindCSS, and shadcn/ui for managing loan referrals.

## Features

🔑 **Authentication & Profile Management**
- Email/password authentication via Supabase Auth
- User profiles with name and mobile number
- Protected routes and RLS (Row Level Security)

📊 **Dashboard**
- Personalized referral links with QR codes
- Real-time referral tracking and statistics
- Masked mobile number display for privacy
- Status filtering (InProgress, Approved, Declined)

📝 **Public Referral Form**
- Dynamic referral links (/r/[ref_code])
- Employment type handling (salaried vs self-employed)
- Terms & conditions acceptance
- Auto-capture referrer information

🔒 **Security & Data Privacy**
- Row Level Security policies
- Mobile number masking function
- Admin/user role separation
- Secure data handling

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: TailwindCSS + shadcn/ui
- **Language**: TypeScript
- **QR Codes**: qrcode.react

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and update with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Database Setup

1. Create a new Supabase project
2. Run the SQL migration in `supabase-migration.sql` in your Supabase SQL editor
3. This will create:
   - `profiles` table linked to auth.users
   - `referrals` table for storing referral data
   - RLS policies for security
   - Mobile masking function
   - Trigger for auto-profile creation

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

### Profiles Table
```sql
profiles (
  id uuid primary key,           -- Links to auth.users.id
  name text not null,
  mobile_no text not null,
  is_admin boolean default false,
  created_at timestamptz default now()
)
```

### Referrals Table
```sql
referrals (
  id uuid primary key,
  referrer_user_id uuid,         -- References profiles.id
  name text not null,
  mobile_no text not null,
  residency_pincode text not null,
  employment_type text,          -- 'salaried' or 'self-employed'
  employer_name text,            -- Required if salaried
  monthly_net_income numeric not null,
  terms_accepted_at timestamptz not null,
  status text default 'InProgress', -- 'InProgress', 'Approved', 'Decline'
  processed_by uuid,             -- Admin who processed
  processed_at timestamptz,
  created_at timestamptz default now()
)
```

## Application Routes

- `/` - Home page (redirects to login/dashboard)
- `/login` - User login
- `/signup` - User registration
- `/dashboard` - Protected dashboard for authenticated users
- `/r/[refCode]` - Public referral form
- `/terms` - Terms and conditions page

## Key Features

### Authentication Flow
1. Users sign up with email, password, name, and mobile number
2. Profile is automatically created via database trigger
3. Users can log in and access protected dashboard

### Referral System
1. Each user gets a unique referral link: `/r/[userId]`
2. QR codes are generated for easy sharing
3. Referral forms capture lead information
4. Data is stored with referrer tracking

### Data Privacy
- Mobile numbers are masked for non-admin users (XX12345XX format)
- RLS policies ensure users only see their own data
- Admins can view/update all referrals

### Mobile Number Masking
The `mask_mobile()` function in the database automatically masks mobile numbers:
- `9876543210` becomes `98xxxxx210`
- Admins see full numbers, regular users see masked versions

## Admin Features

To make a user an admin:
1. Update the `profiles` table: `UPDATE profiles SET is_admin = true WHERE id = 'user-id'`
2. Admins can:
   - View all referrals with unmasked data
   - Update referral status
   - Process applications

## API Examples

### Fetching User Referrals
```typescript
const { data, error } = await supabase
  .from('referrals_masked')
  .select('*')
  .eq('referrer_user_id', userId)
  .order('created_at', { ascending: false })
```

### Submitting a Referral
```typescript
const { error } = await supabase
  .from('referrals')
  .insert({
    referrer_user_id: refCode,
    name: formData.name,
    mobile_no: formData.mobileNo,
    residency_pincode: formData.residencyPincode,
    employment_type: formData.employmentType,
    employer_name: formData.employerName,
    monthly_net_income: formData.monthlyNetIncome,
    terms_accepted_at: new Date().toISOString()
  })
```

### Admin Status Update
```typescript
const { error } = await supabase
  .from('referrals')
  .update({ 
    status: 'Approved',
    processed_by: adminId,
    processed_at: new Date().toISOString()
  })
  .eq('id', referralId)
```

## Development

### Project Structure
```
src/
├── app/
│   ├── dashboard/page.tsx      # Protected dashboard
│   ├── login/page.tsx          # Login page
│   ├── signup/page.tsx         # Registration page
│   ├── r/[refCode]/page.tsx    # Dynamic referral form
│   ├── terms/page.tsx          # Terms and conditions
│   ├── layout.tsx              # Root layout with auth provider
│   ├── page.tsx                # Home page (redirects)
│   └── globals.css             # Global styles
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── QRCodeGenerator.tsx     # QR code component
│   └── ReferralsTable.tsx      # Referrals data table
├── contexts/
│   └── AuthContext.tsx         # Authentication context
└── lib/
    ├── supabase.ts             # Supabase client & types
    └── utils.ts                # Utility functions
```

### Building for Production

```bash
npm run build
npm start
```

## Security Considerations

1. **Row Level Security**: All tables have RLS enabled
2. **Data Masking**: Sensitive data is masked for non-admin users
3. **Input Validation**: Form validation on both client and server
4. **Authentication**: Secure token-based authentication via Supabase
5. **HTTPS**: Always use HTTPS in production

## License

This project is built for MyCredibro B2B platform. All rights reserved.
