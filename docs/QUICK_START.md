# Quick Start Guide

## Step 1: Create .env File

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://fflucpqfqfrzvcdnsgcf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmbHVjcHFmcWZyenZjZG5zZ2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NjgyMjEsImV4cCI6MjA3ODQ0NDIyMX0.xb_8J0WKOt-wVN5RIN730xYaC2RftFfuoDMzGJONzIk
```

## Step 2: Create Database Tables

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/fflucpqfqfrzvcdnsgcf
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the `supabase-schema.sql` file from this project
5. Copy the **entire contents** of the file
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for "Success" message - all tables should be created!

### Option B: Using Command Line (Alternative)

If you have the Supabase CLI installed:

```bash
supabase db push
```

Or use the setup script (requires service role key):

```bash
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
node setup-database.js
```

## Step 3: Verify Tables

1. In Supabase Dashboard, go to **Table Editor**
2. You should see these tables:
   - ✅ students
   - ✅ teachers
   - ✅ hods
   - ✅ users
   - ✅ student_performance
   - ✅ risk_assessments
   - ✅ counseling_sessions

## Step 4: Start the Application

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:5173`

## Step 5: Create Your First HOD Account

1. Navigate to the login page
2. Select the **HOD** tab
3. Click **First Time HOD Registration**
4. Fill in the form and create your account

## Troubleshooting

### Tables not created?
- Make sure you copied the **entire** SQL file content
- Check for any error messages in the SQL Editor
- Verify you're in the correct Supabase project

### Connection errors?
- Verify your `.env` file has the correct credentials
- Make sure the `.env` file is in the root directory
- Restart your development server after creating `.env`

### RLS Policy errors?
- The SQL schema includes RLS policies
- If you get permission errors, check that policies were created
- You can verify in Supabase Dashboard > Authentication > Policies

## Need Help?

Check the full `SETUP.md` file for detailed instructions.

