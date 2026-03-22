# Technical Concepts & Code Architecture

## File Structure

```
src/
├── main.tsx              # Entry point, React root
├── App.tsx               # Routes, providers (QueryClient, Router, Tooltip)
├── index.css             # Tailwind + CSS variables (design tokens)
├── pages/                # Route components
├── components/           # Reusable UI
│   ├── ui/               # shadcn/ui primitives
│   └── *.tsx             # App-specific components
├── lib/
│   ├── supabase.ts       # Supabase client init
│   ├── database.ts       # All data services (auth, CRUD)
│   ├── database-utils.ts # Error handling
│   ├── gemini.ts         # AI counseling suggestions
│   ├── csv-import.ts     # CSV parsing logic
│   └── utils.ts          # cn() etc.
├── hooks/                # Custom React hooks
└── types/
    └── database.ts       # TypeScript interfaces
```

## Risk Calculation Algorithm

**Location**: `lib/database.ts` → `riskService.calculateRisk()`

**Logic**:
1. Fetch all `student_performance` for the student
2. Compute averages (marks, attendance, assignment completion)
3. Apply weighted scoring (see 01-OVERVIEW.md)
4. Sum to get `riskScore` (0–100)
5. Map: 60+ = High, 30–59 = Medium, 0–29 = Low
6. Build `factors[]` for each contributing issue
7. Generate `detailed_report` (marks, attendance, etc.)
8. Call `generateCounselingSuggestions()` (Gemini or fallback)
9. Upsert into `risk_assessments` table

## Authentication Flow

1. User enters credentials on Login page
2. **Student**: ERP → `studentService.getByERP()` → get email → `authService.signIn(email, password)`
3. **Teacher/HOD**: Direct `authService.signIn(email, password)`
4. On success: `authService.getCurrentUserRole()` → `{ role, user_id }`
5. Redirect: `/dashboard/${role}`
6. Dashboards call `authService.getCurrentUserProfile()` to get name, department

**Auth State**: Supabase persists session (localStorage). `getCurrentUser()` returns null when logged out.

## Service Layer (`lib/database.ts`)

Each service exports an object with async methods:

| Service | Key Methods |
|---------|-------------|
| authService | signUp, signIn, signOut, getCurrentUser, getCurrentUserRole, getCurrentUserProfile |
| studentService | getAll, getById, getByERP, create, update, delete |
| teacherService | getByDepartment, create, update, delete |
| hodService | getByDepartment, getById, create, update |
| performanceService | getByStudent, create, update, upsert |
| riskService | calculateRisk, getAllRisks, getRiskSummary |
| counselingService | getByStudent, create, update, getProgress |
| timetableService | getByDepartment, create, update, delete, bulkUpsert |
| eventService | getAll, getUpcoming, create, update, delete |

## Gemini AI Integration

**File**: `lib/gemini.ts`

**Function**: `generateCounselingSuggestions(riskData)`

**Behavior**:
- Requires `VITE_GEMINI_API_KEY` in env
- Sends student risk profile to Gemini Pro API
- Returns 3–5 brief suggestions (each < 100 chars)
- On error or missing key: returns `[]` → app uses rule-based suggestions from `riskService`

**API**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`

## CSV Import

**File**: `lib/csv-import.ts`

Supports:
- **Students**: erp_number, name, email, phone, department, year
- **Teachers**: name, email, phone, department, subjects (comma-separated)
- **Performance**: Links by ERP + subject; recalculates risk after each row

Uses `papaparse` for parsing. Validation via Zod-style checks.
