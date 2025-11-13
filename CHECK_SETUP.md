# Quick Setup Check

## ✅ Checklist

Run through these checks to ensure everything is set up correctly:

### 1. Environment Variables
- [ ] `.env` file exists in root directory
- [ ] Contains `VITE_SUPABASE_URL`
- [ ] Contains `VITE_SUPABASE_ANON_KEY`
- [ ] No extra spaces or quotes around values

### 2. Database Tables
- [ ] Opened Supabase Dashboard
- [ ] Ran `supabase-schema.sql` in SQL Editor
- [ ] All 7 tables created successfully
- [ ] Verified in Table Editor

### 3. Dependencies
- [ ] Ran `npm install`
- [ ] No errors during installation
- [ ] `node_modules` folder exists

### 4. Dev Server
- [ ] Run `npm run dev`
- [ ] Server starts without errors
- [ ] Shows: `Local: http://localhost:8080/`
- [ ] Can access the URL in browser

### 5. Browser Check
- [ ] Open `http://localhost:8080/`
- [ ] Open Developer Tools (F12)
- [ ] Check Console tab for errors
- [ ] Check Network tab - files loading (status 200)

## 🐛 If Still Blank

1. **Check Browser Console** (F12 → Console tab)
   - Look for red error messages
   - Share any errors you see

2. **Check Network Tab** (F12 → Network tab)
   - Refresh page
   - Look for failed requests (red)
   - Check if `main.tsx` loads

3. **Verify Port**
   - App runs on port **8080** (not 5173)
   - URL: `http://localhost:8080/`

4. **Restart Dev Server**
   ```bash
   # Stop server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

5. **Clear Cache**
   ```bash
   # Windows PowerShell:
   Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
   npm run dev
   ```

## 📝 What to Share if Asking for Help

1. Screenshot of browser console (F12)
2. Screenshot of terminal where `npm run dev` is running
3. Any error messages you see
4. What URL you're accessing
5. Whether you see any content or completely blank

## 🎯 Expected Behavior

When working correctly:
- ✅ Landing page loads with "Predict & Prevent Student Dropouts" heading
- ✅ Navigation buttons work
- ✅ No errors in console
- ✅ Can navigate to `/login` page

