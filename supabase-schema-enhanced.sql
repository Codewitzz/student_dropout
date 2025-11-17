-- Enhanced Supabase Database Schema for Comprehensive Student Tracking
-- Run this SQL in your Supabase SQL Editor AFTER running the base schema

-- Enhanced Student Performance Table with Exam Types
ALTER TABLE student_performance 
ADD COLUMN IF NOT EXISTS exam_type TEXT CHECK (exam_type IN ('UT', 'Midterm', 'Final', 'Assignment', 'Project')),
ADD COLUMN IF NOT EXISTS class_participation INTEGER DEFAULT 0 CHECK (class_participation >= 0 AND class_participation <= 100),
ADD COLUMN IF NOT EXISTS discipline_issues INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS doubt_asking_frequency INTEGER DEFAULT 0 CHECK (doubt_asking_frequency >= 0 AND doubt_asking_frequency <= 10),
ADD COLUMN IF NOT EXISTS assignment_completion DECIMAL(5,2) DEFAULT 0 CHECK (assignment_completion >= 0 AND assignment_completion <= 100),
ADD COLUMN IF NOT EXISTS project_completion_rate DECIMAL(5,2) DEFAULT 0 CHECK (project_completion_rate >= 0 AND project_completion_rate <= 100),
ADD COLUMN IF NOT EXISTS homework_submission_rate DECIMAL(5,2) DEFAULT 0 CHECK (homework_submission_rate >= 0 AND homework_submission_rate <= 100),
ADD COLUMN IF NOT EXISTS teacher_remark TEXT,
ADD COLUMN IF NOT EXISTS student_interest_score INTEGER DEFAULT 0 CHECK (student_interest_score >= 0 AND student_interest_score <= 10),
ADD COLUMN IF NOT EXISTS classroom_activity_score INTEGER DEFAULT 0 CHECK (classroom_activity_score >= 0 AND classroom_activity_score <= 10);

-- Study Habits Table
CREATE TABLE IF NOT EXISTS study_habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  study_hours_per_week DECIMAL(5,2) DEFAULT 0 CHECK (study_hours_per_week >= 0),
  practice_tests_attempted INTEGER DEFAULT 0 CHECK (practice_tests_attempted >= 0),
  notes_preparation_quality INTEGER DEFAULT 0 CHECK (notes_preparation_quality >= 0 AND notes_preparation_quality <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Psychological Factors Table
CREATE TABLE IF NOT EXISTS psychological_factors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  stress_level INTEGER DEFAULT 0 CHECK (stress_level >= 0 AND stress_level <= 10),
  motivation_level INTEGER DEFAULT 0 CHECK (motivation_level >= 0 AND motivation_level <= 10),
  confidence_level INTEGER DEFAULT 0 CHECK (confidence_level >= 0 AND confidence_level <= 10),
  assessment_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social & Environmental Factors Table
CREATE TABLE IF NOT EXISTS social_environmental_factors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  negative_friend_circle BOOLEAN DEFAULT FALSE,
  mobile_gaming_addiction BOOLEAN DEFAULT FALSE,
  family_issues BOOLEAN DEFAULT FALSE,
  lack_of_study_environment BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital Learning Activity Table
CREATE TABLE IF NOT EXISTS digital_learning_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  portal_login_frequency INTEGER DEFAULT 0 CHECK (portal_login_frequency >= 0),
  video_lectures_watched_percent DECIMAL(5,2) DEFAULT 0 CHECK (video_lectures_watched_percent >= 0 AND video_lectures_watched_percent <= 100),
  online_tests_taken INTEGER DEFAULT 0 CHECK (online_tests_taken >= 0),
  lms_engagement_score INTEGER DEFAULT 0 CHECK (lms_engagement_score >= 0 AND lms_engagement_score <= 10),
  period_start TIMESTAMPTZ DEFAULT NOW(),
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Academic History Table (for tracking trends and historical data)
CREATE TABLE IF NOT EXISTS academic_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  semester INTEGER,
  year INTEGER,
  overall_marks DECIMAL(5,2) CHECK (overall_marks >= 0 AND overall_marks <= 100),
  overall_attendance DECIMAL(5,2) CHECK (overall_attendance >= 0 AND overall_attendance <= 100),
  total_backlogs INTEGER DEFAULT 0 CHECK (total_backlogs >= 0),
  failed_subjects TEXT[],
  improvement_trend TEXT CHECK (improvement_trend IN ('Improving', 'Stable', 'Declining')),
  dropout_warnings INTEGER DEFAULT 0 CHECK (dropout_warnings >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Predictions & Suggestions Table
CREATE TABLE IF NOT EXISTS ai_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  predicted_risk_level TEXT CHECK (predicted_risk_level IN ('High', 'Medium', 'Low')),
  predicted_risk_score INTEGER CHECK (predicted_risk_score >= 0 AND predicted_risk_score <= 100),
  weak_subjects TEXT[],
  recovery_suggestions TEXT[],
  improvement_actions TEXT[],
  confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_study_habits_student ON study_habits(student_id);
CREATE INDEX IF NOT EXISTS idx_psychological_student ON psychological_factors(student_id);
CREATE INDEX IF NOT EXISTS idx_social_student ON social_environmental_factors(student_id);
CREATE INDEX IF NOT EXISTS idx_digital_student ON digital_learning_activity(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_history_student ON academic_history(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_student ON ai_predictions(student_id);
CREATE INDEX IF NOT EXISTS idx_performance_exam_type ON student_performance(exam_type);

-- Create triggers for updated_at
CREATE TRIGGER update_study_habits_updated_at BEFORE UPDATE ON study_habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_psychological_updated_at BEFORE UPDATE ON psychological_factors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_updated_at BEFORE UPDATE ON social_environmental_factors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_digital_updated_at BEFORE UPDATE ON digital_learning_activity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academic_history_updated_at BEFORE UPDATE ON academic_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_predictions_updated_at BEFORE UPDATE ON ai_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE study_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychological_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_environmental_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_learning_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Allow authenticated users to read study_habits" ON study_habits
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert study_habits" ON study_habits
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update study_habits" ON study_habits
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read psychological_factors" ON psychological_factors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert psychological_factors" ON psychological_factors
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update psychological_factors" ON psychological_factors
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read social_environmental_factors" ON social_environmental_factors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert social_environmental_factors" ON social_environmental_factors
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update social_environmental_factors" ON social_environmental_factors
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read digital_learning_activity" ON digital_learning_activity
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert digital_learning_activity" ON digital_learning_activity
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update digital_learning_activity" ON digital_learning_activity
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read academic_history" ON academic_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert academic_history" ON academic_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update academic_history" ON academic_history
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read ai_predictions" ON ai_predictions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert ai_predictions" ON ai_predictions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update ai_predictions" ON ai_predictions
  FOR UPDATE USING (auth.role() = 'authenticated');

