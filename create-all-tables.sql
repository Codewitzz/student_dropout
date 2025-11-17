-- ============================================================================
-- COMPLETE DATABASE SCHEMA FOR STUDENT DROPOUT PREDICTION SYSTEM
-- ============================================================================
-- Run this SQL script in your Supabase SQL Editor to create all required tables
-- This script includes: Tables, Indexes, Triggers, and RLS Policies
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  erp_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  department TEXT,
  subjects TEXT[], -- Array of subject names
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HODs Table
CREATE TABLE IF NOT EXISTS hods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table (for authentication mapping)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'hod')),
  user_id UUID NOT NULL, -- Reference to student/teacher/hod id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Performance Table (with AI Prediction Fields)
CREATE TABLE IF NOT EXISTS student_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  marks DECIMAL(5,2) NOT NULL CHECK (marks >= 0 AND marks <= 100),
  attendance DECIMAL(5,2) NOT NULL CHECK (attendance >= 0 AND attendance <= 100),
  backlogs INTEGER DEFAULT 0 CHECK (backlogs >= 0),
  internal_marks DECIMAL(5,2) CHECK (internal_marks >= 0 AND internal_marks <= 100),
  semester INTEGER,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  -- AI Prediction Fields (7 Minimum Data Points)
  assignment_completion DECIMAL(5,2) CHECK (assignment_completion >= 0 AND assignment_completion <= 100),
  class_participation TEXT CHECK (class_participation IN ('Low', 'Medium', 'High')),
  motivation_level TEXT CHECK (motivation_level IN ('Low', 'Medium', 'High')),
  stress_level TEXT CHECK (stress_level IN ('Low', 'Medium', 'High')),
  teacher_remark TEXT,
  past_failures INTEGER DEFAULT 0 CHECK (past_failures >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk Assessments Table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('High', 'Medium', 'Low')),
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  factors TEXT[], -- Array of risk factors
  weak_subjects TEXT[], -- Array of weak subjects
  improvement_suggestions TEXT[], -- Array of AI-generated suggestions
  detailed_report JSONB, -- JSON object with detailed analysis
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Counseling Sessions Table
CREATE TABLE IF NOT EXISTS counseling_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  hod_id UUID REFERENCES hods(id) ON DELETE SET NULL,
  before_risk_level TEXT NOT NULL CHECK (before_risk_level IN ('High', 'Medium', 'Low')),
  after_risk_level TEXT CHECK (after_risk_level IN ('High', 'Medium', 'Low')),
  status TEXT NOT NULL CHECK (status IN ('Scheduled', 'Completed', 'Improved', 'Not Improved')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_students_erp ON students(erp_number);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_department ON teachers(department);
CREATE INDEX IF NOT EXISTS idx_performance_student ON student_performance(student_id);
CREATE INDEX IF NOT EXISTS idx_performance_subject ON student_performance(subject);
CREATE INDEX IF NOT EXISTS idx_risk_student ON risk_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_risk_level ON risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_counseling_student ON counseling_sessions(student_id);

-- ============================================================================
-- TRIGGER FUNCTION FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hods_updated_at BEFORE UPDATE ON hods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_updated_at BEFORE UPDATE ON student_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_updated_at BEFORE UPDATE ON risk_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_counseling_updated_at BEFORE UPDATE ON counseling_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hods ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE counseling_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - Allow authenticated users full access
-- ============================================================================

-- Students Policies
CREATE POLICY "Allow authenticated users to read students" ON students
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert students" ON students
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update students" ON students
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete students" ON students
  FOR DELETE USING (auth.role() = 'authenticated');

-- Teachers Policies
CREATE POLICY "Allow authenticated users to read teachers" ON teachers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert teachers" ON teachers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update teachers" ON teachers
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete teachers" ON teachers
  FOR DELETE USING (auth.role() = 'authenticated');

-- HODs Policies
CREATE POLICY "Allow authenticated users to read hods" ON hods
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert hods" ON hods
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update hods" ON hods
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Student Performance Policies
CREATE POLICY "Allow authenticated users to read performance" ON student_performance
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert performance" ON student_performance
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update performance" ON student_performance
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete performance" ON student_performance
  FOR DELETE USING (auth.role() = 'authenticated');

-- Risk Assessments Policies
CREATE POLICY "Allow authenticated users to read risks" ON risk_assessments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert risks" ON risk_assessments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update risks" ON risk_assessments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete risks" ON risk_assessments
  FOR DELETE USING (auth.role() = 'authenticated');

-- Counseling Sessions Policies
CREATE POLICY "Allow authenticated users to read counseling" ON counseling_sessions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert counseling" ON counseling_sessions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update counseling" ON counseling_sessions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete counseling" ON counseling_sessions
  FOR DELETE USING (auth.role() = 'authenticated');

-- Users Policies
CREATE POLICY "Allow authenticated users to read users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert users" ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update users" ON users
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All tables, indexes, triggers, and RLS policies created successfully!';
  RAISE NOTICE '📊 Created 7 tables: students, teachers, hods, users, student_performance, risk_assessments, counseling_sessions';
  RAISE NOTICE '🔒 Row Level Security (RLS) enabled on all tables';
  RAISE NOTICE '⚡ Indexes created for optimal query performance';
  RAISE NOTICE '🔄 Auto-update triggers configured for timestamps';
END $$;

