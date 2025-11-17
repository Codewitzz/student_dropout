# 🚀 Quick Fix for Blank Output

## Most Common Issues & Quick Fixes

### Issue 1: Wrong Port ❌
**Problem:** Accessing `http://localhost:5173` (wrong port)

**Fix:** 
- This app runs on port **8080**
- Access: `http://localhost:8080/`

---

### Issue 2: Environment Variables Not Loading ❌
**Problem:** `.env` file missing or not loaded

**Fix:**
1. Check `.env` file exists in root directory
2. Should contain:
   ```
   VITE_SUPABASE_URL=https://fflucpqfqfrzvcdnsgcf.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. **Restart dev server** after creating/modifying `.env`:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

### Issue 3: Browser Console Errors ❌
**Problem:** JavaScript errors preventing render

**Fix:**
1. Open browser (F12)
2. Check **Console** tab for red errors
3. Common fixes:
   - "Cannot find module" → Run `npm install`
   - "Failed to fetch" → Check Supabase connection
   - Import errors → Check file paths

---

### Issue 4: Cache Issues ❌
**Problem:** Old cached files causing issues

**Fix:**
```bash
# Clear Vite cache
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue

# Restart server
npm run dev
```

---

## Step-by-Step Solution

### Step 1: Verify Setup
```bash
# Check .env exists
Get-Content .env

# Should show your Supabase credentials
```

### Step 2: Start Dev Server
```bash
npm run dev
```

### Step 3: Check Terminal Output
You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:8080/
```

### Step 4: Open Browser
1. Go to: `http://localhost:8080/`
2. Press **F12** (Developer Tools)
3. Check **Console** tab

### Step 5: What to Look For

**✅ Good Signs:**
- Console shows: `🔌 Supabase client initialized`
- No red error messages
- Page loads with content

**❌ Bad Signs:**
- Red errors in console
- "Failed to fetch" messages
- "Cannot find module" errors

---

## If Still Blank

### Check These:

1. **Browser Console (F12 → Console)**
   - Copy any red error messages
   - Share them for help

2. **Network Tab (F12 → Network)**
   - Refresh page
   - Check if files load (status 200)
   - Look for failed requests (red)

3. **Terminal Output**
   - Check for errors when running `npm run dev`
   - Share error messages

---

## Most Likely Fix

**90% of blank output issues are:**
1. Wrong port (use 8080, not 5173)
2. `.env` file not loaded (restart server)
3. Browser cache (hard refresh: Ctrl+Shift+R)

**Try this first:**
```bash
# 1. Stop server (Ctrl+C)

# 2. Clear cache
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue

# 3. Restart
npm run dev

# 4. Open http://localhost:8080/
# 5. Hard refresh: Ctrl+Shift+R
```

---

## Need Help?

Share:
1. Browser console errors (F12 → Console)
2. Terminal output from `npm run dev`
3. What URL you're accessing

