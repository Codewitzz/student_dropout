# Create Database Tables in Supabase

## Quick Steps

Your Supabase credentials are already configured in `.env`. Now you need to create the database tables.

### Method 1: Using Supabase Dashboard (Easiest - Recommended)

1. **Open your Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/fflucpqfqfrzvcdnsgcf
   - Or navigate to: https://app.supabase.com → Select your project

2. **Open SQL Editor**
   - Click on **"SQL Editor"** in the left sidebar
   - Click **"New Query"** button

3. **Copy the SQL Schema**
   - Open the file `supabase-schema.sql` in this project
   - Select all the content (Ctrl+A)
   - Copy it (Ctrl+C)

4. **Paste and Run**
   - Paste the SQL into the SQL Editor
   - Click the **"Run"** button (or press Ctrl+Enter)
   - Wait for the execution to complete

5. **Verify Success**
   - You should see "Success. No rows returned" message
   - Go to **"Table Editor"** in the left sidebar
   - You should see all these tables:
     - ✅ students
     - ✅ teachers
     - ✅ hods
     - ✅ users
     - ✅ student_performance
     - ✅ risk_assessments
     - ✅ counseling_sessions

### Method 2: Using Supabase CLI (If Installed)

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref fflucpqfqfrzvcdnsgcf

# Push the schema
supabase db push
```

## What Gets Created?

The SQL schema will create:

1. **7 Database Tables:**
   - `students` - Student information
   - `teachers` - Teacher information  
   - `hods` - Head of Department information
   - `users` - Authentication mapping
   - `student_performance` - Performance data
   - `risk_assessments` - Risk calculations
   - `counseling_sessions` - Counseling records

2. **Indexes** for better query performance

3. **Triggers** to automatically update `updated_at` timestamps

4. **Row Level Security (RLS) Policies** for data access control

## Troubleshooting

### Error: "relation already exists"
- Some tables might already exist
- The SQL uses `CREATE TABLE IF NOT EXISTS` so it's safe to run again
- You can ignore this error or drop existing tables first

### Error: "permission denied"
- Make sure you're logged into the correct Supabase project
- Verify you have admin access to the project

### Error: "extension uuid-ossp does not exist"
- This is rare, but if it happens, contact Supabase support
- The extension should be available by default

### Tables created but RLS policies missing
- Re-run the SQL statements starting from line 131
- Or manually enable RLS in Table Editor → Settings → Enable RLS

## Next Steps

After creating the tables:

1. ✅ Verify all tables exist in Table Editor
2. ✅ Start your application: `npm run dev`
3. ✅ Create your first HOD account from the login page
4. ✅ Import students/teachers using CSV files

## Need Help?

- Check `QUICK_START.md` for full setup guide
- Check `SETUP.md` for detailed documentation
- Supabase Docs: https://supabase.com/docs

