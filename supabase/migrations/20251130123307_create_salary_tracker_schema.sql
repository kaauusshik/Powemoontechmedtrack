/*
  # Salary Tracker Database Schema

  ## Overview
  Creates a complete database schema for the PowerMoon TechMed Salary Tracker application
  with proper user isolation and data security.

  ## New Tables
  
  ### 1. users
  Custom users table for authentication and profile management
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique, not null) - User email address
  - `password` (text, not null) - Hashed password
  - `name` (text, not null) - User full name
  - `created_at` (timestamptz) - Account creation timestamp
  
  ### 2. employees
  Stores employee information per user
  - `id` (uuid, primary key) - Unique employee identifier
  - `user_id` (uuid, foreign key) - References users table
  - `name` (text, not null) - Employee name
  - `position` (text, not null) - Job position
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 3. salary_records
  Stores monthly salary records for employees
  - `id` (uuid, primary key) - Unique record identifier
  - `user_id` (uuid, foreign key) - References users table
  - `employee_id` (uuid, foreign key) - References employees table
  - `month` (integer, not null) - Month (0-11)
  - `year` (integer, not null) - Year
  - `salary` (numeric, not null) - Base salary amount
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 4. expenses
  Stores expense entries for salary records
  - `id` (uuid, primary key) - Unique expense identifier
  - `user_id` (uuid, foreign key) - References users table
  - `salary_record_id` (uuid, foreign key) - References salary_records table
  - `category` (text, not null) - Expense category
  - `amount` (numeric, not null) - Expense amount
  - `expense_day` (integer, not null) - Day of month (1-31)
  - `expense_month` (integer, not null) - Month (0-11)
  - `expense_year` (integer, not null) - Year
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - All tables have Row Level Security (RLS) enabled
  - Users can only access their own data
  - Policies enforce user_id checks on all operations
  
  ## Indexes
  - Indexes on foreign keys for query performance
  - Unique constraint on email in users table
  - Composite unique constraint on employee_id, month, year in salary_records
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  position text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create salary_records table
CREATE TABLE IF NOT EXISTS salary_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month integer NOT NULL CHECK (month >= 0 AND month <= 11),
  year integer NOT NULL CHECK (year >= 2000 AND year <= 2100),
  salary numeric NOT NULL CHECK (salary >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, month, year)
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  salary_record_id uuid NOT NULL REFERENCES salary_records(id) ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  expense_day integer NOT NULL CHECK (expense_day >= 1 AND expense_day <= 31),
  expense_month integer NOT NULL CHECK (expense_month >= 0 AND expense_month <= 11),
  expense_year integer NOT NULL CHECK (expense_year >= 2000 AND expense_year <= 2100),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_user_id ON salary_records(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_employee_id ON salary_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_salary_record_id ON expenses(salary_record_id);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (current_setting('app.current_user_id', true))::uuid)
  WITH CHECK (id = (current_setting('app.current_user_id', true))::uuid);

-- Allow public registration (anyone can insert)
CREATE POLICY "Anyone can register"
  ON users FOR INSERT
  TO anon
  WITH CHECK (true);

-- RLS Policies for employees table
CREATE POLICY "Users can view their own employees"
  ON employees FOR SELECT
  TO authenticated
  USING (user_id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Users can create their own employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Users can update their own employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (user_id = (current_setting('app.current_user_id', true))::uuid)
  WITH CHECK (user_id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Users can delete their own employees"
  ON employees FOR DELETE
  TO authenticated
  USING (user_id = (current_setting('app.current_user_id', true))::uuid);

-- RLS Policies for salary_records table
CREATE POLICY "Users can view their own salary records"
  ON salary_records FOR SELECT
  TO authenticated
  USING (user_id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Users can create their own salary records"
  ON salary_records FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Users can update their own salary records"
  ON salary_records FOR UPDATE
  TO authenticated
  USING (user_id = (current_setting('app.current_user_id', true))::uuid)
  WITH CHECK (user_id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Users can delete their own salary records"
  ON salary_records FOR DELETE
  TO authenticated
  USING (user_id = (current_setting('app.current_user_id', true))::uuid);

-- RLS Policies for expenses table
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (user_id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Users can create their own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (user_id = (current_setting('app.current_user_id', true))::uuid)
  WITH CHECK (user_id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (user_id = (current_setting('app.current_user_id', true))::uuid);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salary_records_updated_at
  BEFORE UPDATE ON salary_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
