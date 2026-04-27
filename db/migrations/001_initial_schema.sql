-- LifeCore Database Schema - Supabase
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  theme VARCHAR(50) DEFAULT 'light',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trackers table
CREATE TABLE trackers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  prompt_used TEXT,
  config_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tracker sections table
CREATE TABLE tracker_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracker_id UUID REFERENCES trackers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  order_index INTEGER NOT NULL,
  config_json JSONB
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE,
  recurrence_rule TEXT,
  google_event_id VARCHAR(255),
  timer_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workouts table
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_json JSONB NOT NULL,
  generated_prompt TEXT,
  week_number INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workout logs table
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  rating INTEGER
);

-- Nutrition logs table
CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  items_json JSONB NOT NULL,
  source VARCHAR(50) DEFAULT 'manual'
);

-- Grocery lists table
CREATE TABLE grocery_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  items_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Finance entries table
CREATE TABLE finance_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  notes TEXT
);

-- Medicine schedules table
CREATE TABLE medicine_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency_cron VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE
);

-- Medicine logs table
CREATE TABLE medicine_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES medicine_schedules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL
);

-- Audio notes table
CREATE TABLE audio_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  transcript TEXT,
  tags_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_tags JSONB,
  config_json JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  rating_avg DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enterprise groups table
CREATE TABLE enterprise_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_name VARCHAR(255) NOT NULL,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  member_ids_json JSONB,
  shared_templates_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_groups ENABLE ROW LEVEL SECURITY;

-- Users: Users can only access their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Trackers: Users can only access their own trackers
CREATE POLICY "Users can view own trackers" ON trackers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trackers" ON trackers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trackers" ON trackers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trackers" ON trackers FOR DELETE USING (auth.uid() = user_id);

-- Tracker sections
CREATE POLICY "Users can manage own sections" ON tracker_sections FOR ALL USING (
  EXISTS (SELECT 1 FROM trackers WHERE id = tracker_sections.tracker_id AND user_id = auth.uid())
);

-- Events
CREATE POLICY "Users can manage own events" ON events FOR ALL USING (auth.uid() = user_id);

-- Workouts
CREATE POLICY "Users can manage own workouts" ON workouts FOR ALL USING (auth.uid() = user_id);

-- Workout logs
CREATE POLICY "Users can manage own workout logs" ON workout_logs FOR ALL USING (auth.uid() = user_id);

-- Nutrition logs
CREATE POLICY "Users can manage own nutrition logs" ON nutrition_logs FOR ALL USING (auth.uid() = user_id);

-- Grocery lists
CREATE POLICY "Users can manage own grocery lists" ON grocery_lists FOR ALL USING (auth.uid() = user_id);

-- Finance entries
CREATE POLICY "Users can manage own finance entries" ON finance_entries FOR ALL USING (auth.uid() = user_id);

-- Medicine schedules
CREATE POLICY "Users can manage own medicine schedules" ON medicine_schedules FOR ALL USING (auth.uid() = user_id);

-- Medicine logs
CREATE POLICY "Users can manage own medicine logs" ON medicine_logs FOR ALL USING (auth.uid() = user_id);

-- Audio notes
CREATE POLICY "Users can manage own audio notes" ON audio_notes FOR ALL USING (auth.uid() = user_id);

-- Templates: Public templates are readable by all, private only by creator
CREATE POLICY "Public templates are viewable by everyone" ON templates FOR SELECT USING (is_public = true);
CREATE POLICY "Users can manage own templates" ON templates FOR ALL USING (auth.uid() = creator_id);

-- Enterprise groups
CREATE POLICY "Users can manage own groups" ON enterprise_groups FOR ALL USING (
  auth.uid() = admin_id OR auth.uid() = ANY(COALESCE(member_ids_json, '[]'::jsonb))
);

-- Indexes for performance
CREATE INDEX idx_trackers_user_id ON trackers(user_id);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_start_at ON events(start_at);
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_nutrition_logs_user_id ON nutrition_logs(user_id);
CREATE INDEX idx_finance_entries_user_id ON finance_entries(user_id);
CREATE INDEX idx_finance_entries_date ON finance_entries(date);
CREATE INDEX idx_audio_notes_user_id ON audio_notes(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trackers_updated_at BEFORE UPDATE ON trackers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment template download count
CREATE OR REPLACE FUNCTION increment_template_downloads(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE templates SET download_count = download_count + 1 WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;