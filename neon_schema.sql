-- ============================================
-- Neon PostgreSQL Schema for CivicReport
-- Run this SQL in your Neon dashboard SQL editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE (auth)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'citizen' CHECK (role IN ('admin', 'citizen')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  aadhaar_hash TEXT,
  profile_photo TEXT,
  bio TEXT,
  notifications BOOLEAN DEFAULT true,
  role TEXT DEFAULT 'citizen' CHECK (role IN ('admin', 'citizen')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS aadhaar_hash TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;

-- ============================================
-- ISSUES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
  authority_code TEXT NOT NULL DEFAULT 'municipal-grievance',
  authority_name TEXT NOT NULL DEFAULT 'Municipal Civic Grievance Cell',
  forwarding_status TEXT NOT NULL DEFAULT 'queued' CHECK (forwarding_status IN ('queued', 'forwarded', 'failed')),
  forwarded_at TIMESTAMP WITH TIME ZONE,
  forwarding_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE issues ADD COLUMN IF NOT EXISTS authority_code TEXT NOT NULL DEFAULT 'municipal-grievance';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS authority_name TEXT NOT NULL DEFAULT 'Municipal Civic Grievance Cell';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS forwarding_status TEXT NOT NULL DEFAULT 'queued';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS forwarded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS forwarding_error TEXT;

-- ============================================
-- USER ISSUE REWARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_issue_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  issue_count INTEGER DEFAULT 0,
  tokens_claimed BOOLEAN DEFAULT false,
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, month)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_issues_user_id ON issues(user_id);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);
CREATE INDEX IF NOT EXISTS idx_user_issue_rewards_user_month ON user_issue_rewards(user_id, month);

-- ============================================
-- TRIGGER FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS issues_updated_at ON issues;
CREATE TRIGGER issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS user_issue_rewards_updated_at ON user_issue_rewards;
CREATE TRIGGER user_issue_rewards_updated_at
  BEFORE UPDATE ON user_issue_rewards
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
