CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id INTEGER,
  action TEXT NOT NULL,
  details JSONB
);

-- Demo user:
-- email: demo@example.com
-- password: password123
INSERT INTO users (email, password_hash)
VALUES ('demo@example.com', 'password123')
ON CONFLICT (email) DO NOTHING;

