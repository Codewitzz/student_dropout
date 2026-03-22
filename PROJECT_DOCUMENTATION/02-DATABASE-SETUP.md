# Database Setup Guide

## Overview

This application uses **Supabase** (hosted PostgreSQL) for authentication and data storage. The schema is defined in `supabase-schema.sql` at the project root.

## Prerequisites

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project in the Supabase dashboard

## Step-by-Step Setup

### Step 1: Run the Schema

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the entire contents of `supabase-schema.sql` from the project root
4. Paste and click **Run**

This creates:
- **Core tables**: students, teachers, hods, users
- **Performance**: student_performance
- **Risk**: risk_assessments
- **Counseling**: counseling_sessions
- **Schedule**: timetable, events
- **Indexes**, **Triggers**, **RLS Policies**

### Step 2: Configure Authentication

In Supabase Dashboard → **Authentication** → **Providers**:
- Ensure **Email** provider is enabled
- (Optional) Disable "Confirm email" for development: Settings → Auth → Email Auth

### Step 3: Get API Credentials

From Supabase Dashboard → **Settings** → **API**:
- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Step 4: Environment Variables

Create `.env` in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-key-here
```

**Note**: `VITE_GEMINI_API_KEY` is optional. Without it, the app uses rule-based suggestions instead of AI.

## Table Relationships

```
auth.users (Supabase managed)
    └── users (role, user_id → students/teachers/hods)
            ├── students
            ├── teachers
            └── hods

students ──┬── student_performance ──► risk_assessments
           └── counseling_sessions

teachers ──► student_performance, counseling_sessions
hods ──────► counseling_sessions

timetable (department-based)
events (department-based)
```
