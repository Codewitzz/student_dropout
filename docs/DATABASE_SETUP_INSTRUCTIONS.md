# 🚀 Database Setup Instructions

## ✅ Step 1: Environment Variables (Already Done!)

Your `.env` file has been created with your Supabase credentials:
- ✅ URL: `https://fflucpqfqfrzvcdnsgcf.supabase.co`
- ✅ Anon Key: Configured

## 📋 Step 2: Create Database Tables

You need to run the SQL schema in your Supabase Dashboard. Here's how:

### Quick Method:

1. **Go to Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/fflucpqfqfrzvcdnsgcf
   ```

2. **Click "SQL Editor"** (left sidebar)

3. **Click "New Query"**

4. **Open `supabase-schema.sql`** file from this project folder

5. **Copy ALL the content** from the file (Ctrl+A, Ctrl+C)

6. **Paste into SQL Editor** (Ctrl+V)

7. **Click "Run"** button (or press Ctrl+Enter)

8. **Wait for "Success" message**

### What You Should See:

After running, you should see:
- ✅ "Success. No rows returned" message
- ✅ All 7 tables created in Table Editor

### Verify Tables:

1. Go to **"Table Editor"** in left sidebar
2. You should see these tables:
   - `students`
   - `teachers`
   - `hods`
   - `users`
   - `student_performance`
   - `risk_assessments`
   - `counseling_sessions`

## 🎯 Step 3: Test the Application

After tables are created:

```bash
npm run dev
```

Then:
1. Open http://localhost:5173
2. Go to Login page
3. Click "HOD" tab
4. Click "First Time HOD Registration"
5. Create your first HOD account

## ⚠️ Important Notes

- The SQL uses `CREATE TABLE IF NOT EXISTS` - safe to run multiple times
- All tables will have Row Level Security (RLS) enabled
- Indexes are automatically created for better performance
- Triggers are set up to auto-update timestamps

## 🆘 Troubleshooting

**If you see errors:**
- Make sure you copied the ENTIRE SQL file
- Check that you're in the correct Supabase project
- Verify you have admin access

**If tables already exist:**
- That's fine! The SQL won't recreate them
- You can proceed to test the application

## 📚 Additional Resources

- Full setup guide: `SETUP.md`
- Quick start: `QUICK_START.md`
- Table creation details: `CREATE_TABLES.md`

---

**Ready?** Go to your Supabase Dashboard and run the SQL! 🚀

