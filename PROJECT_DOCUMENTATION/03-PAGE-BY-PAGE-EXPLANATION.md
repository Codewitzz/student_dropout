# Page-by-Page Explanation

## 1. Index Page (`/`) - `src/pages/Index.tsx`

**Purpose**: Landing page introducing the system.

**Components**:
- **Top Nav Bar**: Sticky navigation with logo, Learn More, Get Started
- **Hero Section**: Gradient headline, value proposition, CTA buttons
- **Features Section**: 3 cards (Risk Prediction, Role Dashboards, AI Counseling)
- **Stats Section**: 85% accuracy, 3x faster, 92% satisfaction
- **CTA Section**: Gradient banner with Access Dashboard
- **Footer**: Copyright

**Concepts**:
- Responsive design with `sm:`, `md:` breakpoints
- `useNavigate()` for client-side routing
- Tailwind gradient utilities

---

## 2. Login Page (`/login`) - `src/pages/Login.tsx`

**Purpose**: Authentication with role selection.

**Flow**:
1. User selects role (Student / Teacher / HOD) via tabs
2. **Students**: Login with ERP number + password (ERP maps to email)
3. **Teachers/HODs**: Login with email + password
4. **First-time HODs**: "First Time HOD Registration" creates HOD record + auth user

**Key Logic**:
- `authService.signIn()` for existing users
- `authService.signUp()` + `hodService.create()` for first-time HOD
- `studentService.getByERP()` to resolve ERP → student → email
- Credentials saved in `localStorage` for dropdown convenience

**State**: `activeRole`, `isLoading`, `savedCredentials`, `isFirstTimeHOD`

---

## 3. Learn More Page (`/learn-more`) - `src/pages/LearnMore.tsx`

**Purpose**: User guide and documentation.

**Tabs**:
- **Overview**: Feature cards, 7-point system explanation
- **How It Works**: 4-step flow (Data → AI → Risk → Action)
- **HOD Guide**: Getting started, managing teachers, viewing students
- **Teacher Guide**: Entering data, viewing risk, counseling
- **Student Guide**: Viewing dashboard, understanding risk

**Concepts**: Tab-based navigation, responsive layout, educational content

---

## 4. Student Dashboard (`/dashboard/student`) - `src/pages/StudentDashboard.tsx`

**Purpose**: Student's personal view of performance and risk.

**Features**:
- **Risk Alert Card**: Shown when risk ≠ Low; displays level, score, factors
- **Academic Overview**: GPA, Attendance, Backlogs (MetricCards)
- **Subject Performance**: Expandable cards per subject
- **Weekly Timetable**: `TimetableView` component
- **Upcoming Events**: `UpcomingEventsView`
- **AI Counseling**: Suggestions (Gemini or rule-based), recommendations

**Data Flow**:
- `riskService.calculateRisk(userId)` for risk
- `performanceService.getByStudent(userId)` for grades
- `timetableService.getByDepartment()` for schedule
- `eventService.getUpcoming()` for events

---

## 5. Teacher Dashboard (`/dashboard/teacher`) - `src/pages/TeacherDashboard.tsx`

**Purpose**: Manage students, enter performance data, view risk.

**Tabs**:
- **All Students**: Full department list; click High/Medium/Low risk cards to filter
- **My Students**: Filter by subject; view marks, attendance, backlogs; schedule counseling
- **Data Entry**: Add performance data (7-point form); AI prediction
- **Add Students**: Manual add or CSV import

**Key Features**:
- Risk card click → `handleRiskCardClick()` → filters by risk level, scrolls to list
- Subject dropdown → `teacherService.getByDepartment()` → students for that subject
- `riskService.calculateRisk()` per student for risk badge
- `CSVImport` component for bulk student import

---

## 6. HOD Dashboard (`/dashboard/hod`) - `src/pages/HODDashboard.tsx`

**Purpose**: Department-wide management.

**Tabs**:
- **Profile**: Edit HOD profile
- **Students**: All department students; risk filter
- **Teachers**: List, add, edit teachers
- **Timetable**: Weekly schedule editor
- **Events**: Add/edit/delete exams, assignments, seminars
- **Counseling Progress**: Before/after risk, status
- **Add Teacher**: Form for new teacher
- **Import CSV**: Bulk import teachers/students
- **Diagnostic**: Database connectivity check

**Key Features**:
- Risk distribution visualization (High/Medium/Low circles)
- Timetable grid editor
- Event CRUD with type (exam, assignment, etc.)
- Counseling progress tracking

---

## 7. NotFound Page (`/*`) - `src/pages/NotFound.tsx`

**Purpose**: 404 fallback for unknown routes.

---

## Shared Components

| Component | Location | Purpose |
|-----------|----------|---------|
| StudentList | `components/StudentList.tsx` | Searchable, sortable, filterable student table |
| StudentProfileModal | `components/StudentProfileModal.tsx` | Student details modal |
| TeacherProfileModal | `components/TeacherProfileModal.tsx` | Teacher details modal |
| CSVImport | `components/CSVImport.tsx` | CSV upload for students/teachers/performance |
| DatabaseDiagnostic | `components/DatabaseDiagnostic.tsx` | Connection test UI |
| ErrorBoundary | `components/ErrorBoundary.tsx` | Catches React errors, shows fallback UI |
