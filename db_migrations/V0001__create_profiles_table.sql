CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 99),
  city VARCHAR(100) NOT NULL,
  gender VARCHAR(20) NOT NULL,
  looking_for VARCHAR(20) NOT NULL,
  bio TEXT NOT NULL,
  interests TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
