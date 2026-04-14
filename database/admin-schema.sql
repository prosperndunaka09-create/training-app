-- Real Admin Dashboard Database Schema
-- Professional task platform with security and audit trails

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'support', 'reviewer')),
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

-- Users Table (Enhanced)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  display_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  vip_level INTEGER DEFAULT 1 CHECK (vip_level IN (1, 2)),
  balance DECIMAL(10,2) DEFAULT 0.00,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  account_type VARCHAR(20) DEFAULT 'personal' CHECK (account_type IN ('personal', 'training')),
  user_status VARCHAR(20) DEFAULT 'registered' CHECK (user_status IN ('registered', 'active', 'suspended', 'flagged')),
  training_completed BOOLEAN DEFAULT FALSE,
  training_progress INTEGER DEFAULT 0,
  training_phase INTEGER DEFAULT 1 CHECK (training_phase IN (1, 2)),
  tasks_completed INTEGER DEFAULT 0,
  is_frozen BOOLEAN DEFAULT FALSE,
  freeze_reason TEXT,
  flagged_reason TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE
);

-- Tasks Table (Real Task System)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  reward_value DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  due_date TIMESTAMP WITH TIME ZONE,
  eligibility_rules JSONB,
  proof_required BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Tasks Assignment Table
CREATE TABLE IF NOT EXISTS user_task_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'submitted', 'under_review', 'approved', 'rejected')),
  submission_data JSONB,
  submission_date TIMESTAMP WITH TIME ZONE,
  review_data JSONB,
  reviewed_by UUID REFERENCES admin_users(id),
  review_date TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  reward_paid BOOLEAN DEFAULT FALSE,
  reward_paid_date TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, task_id)
);

-- Payout Requests Table
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  method_details JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES admin_users(id),
  review_date TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  approved_amount DECIMAL(10,2),
  paid_at TIMESTAMP WITH TIME ZONE,
  transaction_hash VARCHAR(255)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  actor_email VARCHAR(255) NOT NULL,
  actor_role VARCHAR(50) NOT NULL,
  target_user_id UUID REFERENCES users(id),
  target_data JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details TEXT,
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Login Attempts Table (Security)
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  failure_reason VARCHAR(255)
);

-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(user_status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_user_assignments_user ON user_task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_task ON user_task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user ON payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);

-- Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Owner full access" ON admin_users FOR ALL USING (
  auth.jwt() ->> 'role' = 'owner'
);

CREATE POLICY "Admin access users" ON users FOR ALL USING (
  auth.jwt() ->> 'role' IN ('owner', 'admin', 'support', 'reviewer')
);

CREATE POLICY "Admin access tasks" ON tasks FOR ALL USING (
  auth.jwt() ->> 'role' IN ('owner', 'admin', 'support')
);

CREATE POLICY "Admin access assignments" ON user_task_assignments FOR ALL USING (
  auth.jwt() ->> 'role' IN ('owner', 'admin', 'support', 'reviewer')
);

CREATE POLICY "Admin access payouts" ON payout_requests FOR ALL USING (
  auth.jwt() ->> 'role' IN ('owner', 'admin', 'support')
);

CREATE POLICY "Owner only audit logs" ON audit_logs FOR SELECT USING (
  auth.jwt() ->> 'role' = 'owner'
);

CREATE POLICY "Admin can create audit logs" ON audit_logs FOR INSERT WITH CHECK (
  auth.jwt() ->> 'role' IN ('owner', 'admin', 'support', 'reviewer')
);

CREATE POLICY "Owner only settings" ON system_settings FOR ALL USING (
  auth.jwt() ->> 'role' = 'owner'
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('site_name', '"Optimize Tasks"', 'Platform name'),
  ('max_login_attempts', '5', 'Maximum failed login attempts before lockout'),
  ('session_timeout_minutes', '60', 'Session timeout in minutes'),
  ('maintenance_mode', 'false', 'Maintenance mode status'),
  ('min_payout_amount', '10.00', 'Minimum payout amount'),
  ('payout_review_required', 'true', 'Require manual payout review'),
  ('force_strong_passwords', 'true', 'Require strong passwords')
ON CONFLICT (setting_key) DO NOTHING;
