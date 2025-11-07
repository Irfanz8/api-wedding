/**
 * SQL migration script for Supabase
 * Copy and run this in the Supabase SQL editor
 */

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitation_code VARCHAR(20) UNIQUE NOT NULL,
  groom_name VARCHAR(255) NOT NULL,
  bride_name VARCHAR(255) NOT NULL,
  ceremony_date DATE NOT NULL,
  ceremony_time TIME NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  max_guests INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create confirmations table
CREATE TABLE IF NOT EXISTS confirmations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  plus_one BOOLEAN DEFAULT FALSE,
  dietary_restrictions TEXT,
  confirmed BOOLEAN DEFAULT FALSE,
  confirmation_code VARCHAR(50) UNIQUE NOT NULL,
  qr_code_data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invitations_user_id ON invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_confirmations_invitation_id ON confirmations(invitation_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_email ON confirmations(guest_email);
CREATE INDEX IF NOT EXISTS idx_confirmations_code ON confirmations(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own invitations
CREATE POLICY "Users can view own invitations" ON invitations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create invitations" ON invitations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invitations" ON invitations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invitations" ON invitations
  FOR DELETE USING (auth.uid() = user_id);

-- Policy: Anyone can view confirmations for public invitations
CREATE POLICY "Public confirmations view" ON confirmations
  FOR SELECT USING (true);

-- Policy: Users can manage confirmations for their invitations
CREATE POLICY "Users can update confirmations" ON confirmations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM invitations 
      WHERE invitations.id = confirmations.invitation_id 
      AND invitations.user_id = auth.uid()
    )
  );
