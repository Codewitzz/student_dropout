# 🔧 Database Fetching Problem - Solutions

## Common Issues & Fixes

### Issue 1: Row Level Security (RLS) Policies Blocking Queries

**Symptoms:**
- Empty data returned
- "Permission denied" errors
- Tables show as inaccessible in diagnostic

**Solution:**
1. Go to Supabase Dashboard → Authentication → Policies
2. Check if RLS is enabled for your tables
3. For development, you can temporarily disable RLS or create permissive policies:

```sql
-- Allow all authenticated users (for development)
CREATE POLICY "Allow all authenticated users" ON students
  FOR ALL USING (auth.role() = 'authenticated');

-- Or disable RLS temporarily (NOT for production)
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
```

### Issue 2: Tables Don't Exist

**Symptoms:**
- "Table does not exist" errors
- "relation does not exist" errors

**Solution:**
1. Go to Supabase Dashboard → SQL Editor
2. Run the `supabase-schema.sql` file
3. Verify tables in Table Editor

### Issue 3: Not Authenticated

**Symptoms:**
- Queries fail silently
- "JWT" or "token" errors
- Authentication check fails

**Solution:**
1. Make sure you're logged in
2. Check if RLS policies require authentication
3. Verify Supabase auth is working

### Issue 4: Wrong Environment Variables

**Symptoms:**
- Connection fails
- "Invalid API key" errors

**Solution:**
1. Check `.env` file exists
2. Verify values are correct (no extra spaces)
3. Restart dev server after changes

## Quick Diagnostic Steps

### Step 1: Run Database Diagnostic

The app now includes a diagnostic tool. Look for it in the dashboard or add this to any page:

```tsx
import { DatabaseDiagnostic } from '@/components/DatabaseDiagnostic';

// In your component:
<DatabaseDiagnostic />
```

### Step 2: Check Browser Console

1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for database errors
4. Check for detailed error messages

### Step 3: Verify Supabase Setup

1. Go to Supabase Dashboard
2. Check Table Editor - tables should exist
3. Check SQL Editor - run a test query:
   ```sql
   SELECT * FROM students LIMIT 1;
   ```

## Enhanced Error Messages

The database service now provides better error messages:

- **RLS Policy Error**: "Permission denied. Check Row Level Security (RLS) policies"
- **Table Not Found**: "Table not found. Make sure you ran the SQL schema"
- **Network Error**: "Network error. Check your internet connection"
- **Auth Error**: "Authentication error. Check your Supabase API key"

## Testing Database Connection

You can test the connection programmatically:

```typescript
import { testDatabaseConnection } from '@/lib/database-utils';

const result = await testDatabaseConnection();
console.log(result);
```

## Fixing RLS Policies

If RLS is blocking queries, update policies in Supabase:

1. Go to Authentication → Policies
2. Select your table
3. Create new policy or modify existing
4. For development, use:

```sql
-- Allow all operations for authenticated users
CREATE POLICY "dev_policy" ON students
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## Still Having Issues?

1. **Check Console**: Look for specific error messages
2. **Run Diagnostic**: Use the DatabaseDiagnostic component
3. **Verify Tables**: Check Supabase Dashboard → Table Editor
4. **Test Query**: Try a simple query in SQL Editor
5. **Check RLS**: Verify policies allow your operations

## Quick Fix Checklist

- [ ] Tables exist in Supabase Dashboard
- [ ] SQL schema has been run
- [ ] `.env` file has correct values
- [ ] Dev server restarted after `.env` changes
- [ ] RLS policies allow your operations
- [ ] User is authenticated (if required)
- [ ] Browser console shows no errors
- [ ] Network requests succeed (F12 → Network tab)

