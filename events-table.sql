-- Events Table for Department Events/Calendar
-- Run this SQL in your Supabase SQL Editor

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('exam', 'assignment', 'event', 'holiday', 'seminar')),
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_department ON events(department);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- Trigger for auto-update timestamp
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Allow authenticated users to read events" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow HOD to manage their department events" ON events
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users u
      JOIN hods h ON u.user_id = h.id
      WHERE u.id = auth.uid() AND u.role = 'hod' AND h.department = events.department
    )
  );

