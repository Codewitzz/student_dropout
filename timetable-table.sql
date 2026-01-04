-- Timetable Table for Department Schedules
-- Run this SQL in your Supabase SQL Editor

-- Timetable Table
CREATE TABLE IF NOT EXISTS timetable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department TEXT NOT NULL,
  day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  period INTEGER NOT NULL CHECK (period >= 1 AND period <= 8),
  time_slot TEXT NOT NULL, -- e.g., "09:00 - 10:00"
  subject TEXT NOT NULL, -- Subject name, "Break", or "Lab"
  location TEXT, -- Optional room/location
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department, day, period) -- One entry per department/day/period
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_timetable_department ON timetable(department);
CREATE INDEX IF NOT EXISTS idx_timetable_day ON timetable(day);

-- Trigger for auto-update timestamp
CREATE TRIGGER update_timetable_updated_at BEFORE UPDATE ON timetable
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;

-- RLS Policies for timetable
CREATE POLICY "Allow authenticated users to read timetable" ON timetable
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow HOD to manage their department timetable" ON timetable
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users u
      JOIN hods h ON u.user_id = h.id
      WHERE u.id = auth.uid() AND u.role = 'hod' AND h.department = timetable.department
    )
  );

