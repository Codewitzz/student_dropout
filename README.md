# Student Dropout Prevention System

AI-powered web application for educational institutions to predict student dropout risk and provide timely interventions through performance analysis and personalized counseling recommendations.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)

---

## Features

- **7-Point Risk Assessment** – Marks, attendance, assignments, participation, motivation, stress, past failures
- **Role-Based Dashboards** – Student, Teacher, and HOD (Head of Department) views
- **AI Counseling Suggestions** – Powered by Google Gemini (optional)
- **Performance Tracking** – Per-subject grades, attendance, backlogs
- **Counseling Progress** – Track before/after risk levels
- **Timetable & Events** – Department schedules, exams, assignments
- **CSV Import** – Bulk import students, teachers, performance data
- **Mobile Responsive** – Optimized for all screen sizes

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui (Radix) |
| Backend | Supabase (PostgreSQL + Auth) |
| AI | Google Gemini API (optional) |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- (Optional) Google AI API key for Gemini

### 1. Clone & Install

```bash
cd student_dropout
npm install
```

### 2. Database Setup

1. Create a project at [supabase.com](https://supabase.com)
2. In Supabase SQL Editor, run the entire `supabase-schema.sql` file from this project

### 3. Environment Variables

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-key-here
```

Get URL and anon key from Supabase Dashboard → Settings → API.

`VITE_GEMINI_API_KEY` is optional; without it, rule-based suggestions are used.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 5. First-Time Setup

- Register an HOD: Login page → HOD tab → "First Time HOD Registration"
- Add teachers: HOD Dashboard → Add Teacher (or Import CSV)
- Add students: Teacher/HOD Dashboard → Add Students (or Import CSV)
- Enter performance data: Teacher Dashboard → Data Entry

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build (output: `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
student_dropout/
├── src/
│   ├── pages/          # Route pages (Index, Login, Dashboards)
│   ├── components/     # Reusable components
│   ├── lib/            # Services (database, gemini, supabase)
│   ├── types/          # TypeScript interfaces
│   └── hooks/          # Custom hooks
├── supabase-schema.sql # Database schema (run in Supabase)
├── PROJECT_DOCUMENTATION/  # Detailed documentation
│   ├── 01-OVERVIEW.md
│   ├── 02-DATABASE-SETUP.md
│   ├── 03-PAGE-BY-PAGE-EXPLANATION.md
│   ├── 04-TECHNICAL-CONCEPTS.md
│   └── 05-DEPLOYMENT.md
└── README.md
```

---

## Documentation

For in-depth explanations, see the **PROJECT_DOCUMENTATION** folder:

- **01-OVERVIEW.md** – Architecture, concepts, tech stack
- **02-DATABASE-SETUP.md** – Supabase setup, tables, RLS
- **03-PAGE-BY-PAGE-EXPLANATION.md** – Each page and component
- **04-TECHNICAL-CONCEPTS.md** – Risk algorithm, services, AI integration
- **05-DEPLOYMENT.md** – Build, env vars, hosting

---

## Deployment

```bash
npm run build
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, etc.). Set environment variables in your hosting platform. See **PROJECT_DOCUMENTATION/05-DEPLOYMENT.md** for details.

---

## License

Proprietary – Powered by Codwitzz team.
