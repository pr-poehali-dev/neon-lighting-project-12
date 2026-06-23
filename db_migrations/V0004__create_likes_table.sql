CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES users(id),
  to_profile_id INTEGER NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_user_id, to_profile_id)
);
