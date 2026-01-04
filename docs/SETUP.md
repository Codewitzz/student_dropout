# Setup Guide for Educate Elevate Bot

This guide will help you set up the Supabase backend database and configure the application.

## Prerequisites

- Node.js (v18 or higher)
- npm or bun
- A Supabase account (free tier works)

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: `educate-elevate-bot` (or any name you prefer)
   - Database Password: Choose a strong password (save it!)
   - Region: Choose the closest region
5. Wait for the project to be created (takes ~2 minutes)

## Step 2: Set Up Database Schema

1. In your Supabase project, go to the **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` file
4. Paste it into the SQL Editor
5. Click "Run" to execute the SQL
6. You should see "Success. No rows returned" - this means the tables were created successfully

## Step 3: Get Supabase Credentials

1. In your Supabase project, go to **Settings** → **API**
2. You'll find:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

## Step 4: Configure Environment Variables

1. Create a `.env` file in the root directory of the project
2. Add the following:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

Replace:
- `your-project-id` with your actual Supabase project ID
- `your-anon-key-here` with your actual anon key from Step 3
- `your-gemini-api-key-here` with your Gemini API key (optional - see Step 4a)

### Step 4a: Get Gemini API Key (Optional but Recommended)

The system uses Google's Gemini AI to generate brief, personalized counseling suggestions. Without this key, the system will use rule-based suggestions as a fallback.

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey) or [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new API key for Gemini API
3. Copy the API key
4. Add it to your `.env` file as `VITE_GEMINI_API_KEY`

**Note:** The Gemini API key is optional. If not provided, the system will automatically use rule-based suggestions instead.

## Step 5: Install Dependencies

```bash
npm install
# or
bun install
```

## Step 6: Start Development Server

```bash
npm run dev
# or
bun run dev
```

The application should now be running at `http://localhost:5173`

## Step 7: Create Your First HOD Account

1. Navigate to the login page
2. Select the "HOD" tab
3. Click "First Time HOD Registration"
4. Fill in the form:
   - Full Name
   - Department
   - Email
   - Password
   - Confirm Password
5. Click "Create HOD Account"

## CSV Import Format

### Students CSV Format

Required columns:
- `erp_number` - Unique ERP/Student ID
- `name` - Student's full name

Optional columns:
- `email` - Student email
- `phone` - Phone number
- `department` - Department name
- `year` - Year of study (1, 2, 3, 4)

Example:
```csv
erp_number,name,email,phone,department,year
2021001,John Doe,john@example.com,1234567890,Computer Science,3
2021002,Jane Smith,jane@example.com,0987654321,Computer Science,2
```

### Teachers CSV Format

Required columns:
- `name` - Teacher's full name
- `email` - Teacher email (must be unique)

Optional columns:
- `phone` - Phone number
- `department` - Department name
- `subjects` - Comma-separated list of subjects (e.g., "DBMS,Networks")

Example:
```csv
name,email,phone,department,subjects
Dr. Rajesh Kumar,rajesh@college.edu,1234567890,Computer Science,"DBMS,Networks"
Prof. Anjali Verma,anjali@college.edu,0987654321,Computer Science,"Web Development"
```

## Troubleshooting

### Database Connection Issues

- Verify your `.env` file has the correct Supabase URL and anon key
- Make sure you've run the SQL schema in Supabase
- Check that Row Level Security (RLS) policies are set up correctly

### Authentication Issues

- Ensure users are created in the `users` table with correct role mappings
- Check that the `auth.users` table has corresponding entries
- Verify email confirmation is disabled in Supabase Auth settings (for development)

### CSV Import Errors

- Ensure CSV file has headers in the first row
- Check that required columns are present
- Verify data types match expected formats
- Check for duplicate entries (ERP numbers for students, emails for teachers)

## Database Tables Overview

- **students** - Student information
- **teachers** - Teacher information
- **hods** - Head of Department information
- **users** - Authentication mapping
- **student_performance** - Student marks, attendance, backlogs
- **risk_assessments** - Calculated risk levels for students
- **counseling_sessions** - Counseling session records

## Security Notes

- The current RLS policies allow all authenticated users to read/write
- For production, you should customize these policies based on your security requirements
- Consider implementing role-based access control in the policies
- Never commit your `.env` file to version control

## Next Steps

1. Import students and teachers using CSV files
2. Add performance data through the Teacher Dashboard
3. Monitor risk assessments in the HOD Dashboard
4. Set up counseling sessions for at-risk students

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check Supabase logs in the Dashboard
3. Verify all environment variables are set correctly
4. Ensure database schema is properly set up

