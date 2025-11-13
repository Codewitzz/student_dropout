# Troubleshooting Blank Output

If you're seeing a blank page, follow these steps:

## Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Look for any red error messages
4. Share the error messages if you see any

## Step 2: Verify Dev Server is Running

1. Make sure the dev server is running:
   ```bash
   npm run dev
   ```

2. Check the terminal output - you should see:
   ```
   VITE v5.x.x  ready in xxx ms
   ➜  Local:   http://localhost:8080/
   ```

3. **Note**: The app runs on port **8080**, not 5173!

## Step 3: Check Environment Variables

1. Verify `.env` file exists in the root directory
2. Check it contains:
   ```
   VITE_SUPABASE_URL=https://fflucpqfqfrzvcdnsgcf.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Important**: After creating/modifying `.env`, restart the dev server!

## Step 4: Clear Cache and Restart

1. Stop the dev server (Ctrl+C)
2. Clear node_modules cache:
   ```bash
   rm -rf node_modules/.vite
   # Or on Windows:
   Remove-Item -Recurse -Force node_modules\.vite
   ```

3. Restart the dev server:
   ```bash
   npm run dev
   ```

## Step 5: Check Network Tab

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Refresh the page
4. Look for failed requests (red status codes)
5. Check if `main.tsx` and other files are loading (status 200)

## Step 6: Verify Dependencies

Make sure all dependencies are installed:

```bash
npm install
```

## Step 7: Check for TypeScript Errors

```bash
npm run lint
```

## Common Issues

### Issue: "Cannot find module"
- **Solution**: Run `npm install` again

### Issue: "Environment variables not loading"
- **Solution**: 
  1. Make sure `.env` is in the root directory (same level as `package.json`)
  2. Restart the dev server
  3. Variables must start with `VITE_` to be accessible

### Issue: "Port already in use"
- **Solution**: 
  - Change port in `vite.config.ts`
  - Or kill the process using port 8080

### Issue: "Blank page with no errors"
- **Solution**: 
  1. Check browser console for React errors
  2. Verify `index.html` has `<div id="root"></div>`
  3. Check if CSS is loading

## Still Not Working?

1. Open browser console (F12)
2. Take a screenshot of any errors
3. Check the Network tab for failed requests
4. Share the error messages

## Quick Test

Try accessing: `http://localhost:8080/`

You should see the landing page. If not, check the console for errors.

