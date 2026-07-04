-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  muscle_groups TEXT NOT NULL,
  is_rest BOOLEAN DEFAULT false,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL,
  day_key TEXT NOT NULL,
  user_id TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create body_metrics table
CREATE TABLE IF NOT EXISTS body_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL,
  user_id TEXT NOT NULL,
  weight_kg NUMERIC,
  height_cm NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_day_key ON sessions(day_key);
CREATE INDEX IF NOT EXISTS idx_body_metrics_date ON body_metrics(date);
CREATE INDEX IF NOT EXISTS idx_body_metrics_user_id ON body_metrics(user_id);

-- Enable Row Level Security
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for sharing data)
CREATE POLICY "Allow public read access on schedules" ON schedules FOR SELECT USING (true);
CREATE POLICY "Allow public read access on sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow public read access on body_metrics" ON body_metrics FOR SELECT USING (true);

-- Allow public insert/update (for simplicity - you can add auth later)
CREATE POLICY "Allow public insert on schedules" ON schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on schedules" ON schedules FOR UPDATE USING (true);
CREATE POLICY "Allow public insert on sessions" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on sessions" ON sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public insert on body_metrics" ON body_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on body_metrics" ON body_metrics FOR DELETE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
