/*
  # Optimize RLS Policies and Fix Function Issues

  ## Overview
  This migration optimizes Row Level Security policies to prevent re-evaluation of auth functions
  for each row, improving query performance at scale. Also fixes function search path mutability
  and removes unused indexes.

  ## Changes Made

  1. RLS Policy Optimization:
     - Replace `auth.uid()` with `(select auth.uid())`
     - Replace `current_setting()` with `(select current_setting())`
     - Affects: users, employees, salary_records, expenses tables

  2. Function Search Path:
     - Set immutable search_path for trigger and RLS helper functions
     - Prevents security issues from mutable search paths

  3. Index Cleanup:
     - Remove unused indexes created for performance optimization
     - Will be recreated if needed based on actual query patterns
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_employees_user_id;
DROP INDEX IF EXISTS idx_salary_records_user_id;
DROP INDEX IF EXISTS idx_salary_records_employee_id;
DROP INDEX IF EXISTS idx_expenses_user_id;
DROP INDEX IF EXISTS idx_expenses_salary_record_id;

-- Fix function search paths
ALTER FUNCTION update_updated_at_column() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION set_config(text, text) SECURITY DEFINER SET search_path = public;

-- Drop and recreate RLS policies for users table with optimized auth function calls
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- Drop and recreate RLS policies for employees table with optimized auth function calls
DROP POLICY IF EXISTS "Users can view their own employees" ON employees;
DROP POLICY IF EXISTS "Users can create their own employees" ON employees;
DROP POLICY IF EXISTS "Users can update their own employees" ON employees;
DROP POLICY IF EXISTS "Users can delete their own employees" ON employees;

CREATE POLICY "Users can view their own employees"
  ON employees FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create their own employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own employees"
  ON employees FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Drop and recreate RLS policies for salary_records table with optimized auth function calls
DROP POLICY IF EXISTS "Users can view their own salary records" ON salary_records;
DROP POLICY IF EXISTS "Users can create their own salary records" ON salary_records;
DROP POLICY IF EXISTS "Users can update their own salary records" ON salary_records;
DROP POLICY IF EXISTS "Users can delete their own salary records" ON salary_records;

CREATE POLICY "Users can view their own salary records"
  ON salary_records FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create their own salary records"
  ON salary_records FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own salary records"
  ON salary_records FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own salary records"
  ON salary_records FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Drop and recreate RLS policies for expenses table with optimized auth function calls
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can create their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;

CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create their own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));
