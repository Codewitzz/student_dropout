# 🔧 Fix: Environment Variables Not Loading

## Problem
You're seeing:
```
❌ Missing Supabase environment variables!
⚠️ Using placeholder values. App may not work correctly.
```

## Solution: Restart Dev Server

**Vite only loads `.env` files when the dev server starts!**

### Steps:

1. **Stop the dev server:**
   - Press `Ctrl+C` in the terminal where `npm run dev` is running

2. **Restart the dev server:**
   ```bash
   npm run dev
   ```

3. **Check the console:**
   - You should now see: `🔌 Supabase client initialized: { url: 'https://fflucpqfqfrzvcdnsgcf...', hasKey: true }`
   - The error messages should disappear

## Verify .env File

Your `.env` file should be in the **root directory** (same level as `package.json`):

```
educate-elevate-bot/
  ├── .env          ← Should be here
  ├── package.json
  ├── src/
  └── ...
```

Content should be:
```
VITE_SUPABASE_URL=https://fflucpqfqfrzvcdnsgcf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:**
- No spaces around `=`
- No quotes around values
- No trailing spaces
- Each variable on its own line

## Still Not Working?

### Check 1: File Location
```bash
# Verify .env is in root
Get-Content .env
```

### Check 2: File Encoding
The file should be UTF-8 without BOM. If you see issues, recreate it:

```bash
# Windows PowerShell - Create clean .env file
@"
VITE_SUPABASE_URL=https://fflucpqfqfrzvcdnsgcf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmbHVjcHFmcWZyenZjZG5zZ2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NjgyMjEsImV4cCI6MjA3ODQ0NDIyMX0.xb_8J0WKOt-wVN5RIN730xYaC2RftFfuoDMzGJONzIk
"@ | Out-File -FilePath .env -Encoding utf8 -NoNewline
```

### Check 3: Clear Vite Cache
```bash
# Stop server first (Ctrl+C)
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
npm run dev
```

## After Restart

You should see in the browser console:
```
🔌 Supabase client initialized: { url: 'https://fflucpqfqfrzvcdnsgcf...', hasKey: true }
Environment check: { hasUrl: true, hasKey: true, url: 'https://fflucpqfqfrzvcdnsgcf...' }
```

**No more error messages!** ✅

