# Deployment Guide

## Build for Production

```bash
npm install
npm run build
```

Output: `dist/` folder with static files.

## Environment Variables

Create `.env` or set in your hosting platform:

| Variable | Required | Description |
|----------|----------|-------------|
| VITE_SUPABASE_URL | Yes | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Yes | Supabase anon/public key |
| VITE_GEMINI_API_KEY | No | For AI suggestions; app works without it |

**Important**: All env vars must start with `VITE_` to be exposed to the client in Vite.

## Hosting Options

### Vercel
1. Connect GitHub repo
2. Set environment variables in Project Settings
3. Build command: `npm run build`
4. Output directory: `dist`

### Netlify
1. Connect repo
2. Build: `npm run build`
3. Publish: `dist`
4. Add env vars in Site settings → Environment

### Static Hosting (GitHub Pages, S3, etc.)
- Build locally, upload `dist/` contents
- Ensure SPA routing: all routes redirect to `index.html`

## Pre-Deployment Checklist

- [ ] Run `supabase-schema.sql` in Supabase SQL Editor
- [ ] Create timetable and events tables (included in schema)
- [ ] Set Supabase URL and anon key in hosting env
- [ ] (Optional) Set Gemini API key for AI features
- [ ] Test login for Student, Teacher, HOD roles
- [ ] Verify at least one HOD is registered for first-time setup
