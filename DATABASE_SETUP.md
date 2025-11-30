# Database Setup Documentation

## Overview

The PowerMoon TechMed Salary Tracker now uses Supabase PostgreSQL database for data persistence with proper user isolation and security through Row Level Security (RLS).

## Database Schema

### Tables

#### 1. users
Stores user authentication and profile information.

**Columns:**
- `id` (uuid, primary key) - Unique user identifier
- `email` (text, unique, not null) - User email address
- `password` (text, not null) - Hashed password using bcryptjs
- `name` (text, not null) - User full name
- `created_at` (timestamptz) - Account creation timestamp

**Security:** RLS enabled with policies for:
- SELECT: Users can view their own profile
- UPDATE: Users can update their own profile
- INSERT: Anyone can register (public access)

#### 2. employees
Stores employee information with user ownership.

**Columns:**
- `id` (uuid, primary key) - Unique employee identifier
- `user_id` (uuid, foreign key) - References users table
- `name` (text, not null) - Employee name
- `position` (text, not null) - Job position
- `created_at` (timestamptz) - Record creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Security:** RLS enabled with policies for:
- SELECT: Users can view their own employees
- INSERT: Users can create their own employees
- UPDATE: Users can update their own employees
- DELETE: Users can delete their own employees

#### 3. salary_records
Stores monthly salary records for employees.

**Columns:**
- `id` (uuid, primary key) - Unique record identifier
- `user_id` (uuid, foreign key) - References users table
- `employee_id` (uuid, foreign key) - References employees table
- `month` (integer, 0-11) - Month index
- `year` (integer, 2000-2100) - Year
- `salary` (numeric, >= 0) - Base salary amount
- `created_at` (timestamptz) - Record creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Constraints:**
- Unique constraint on (employee_id, month, year)
- Check constraints for valid month and year ranges

**Security:** RLS enabled with policies for all CRUD operations restricted to user's own data.

#### 4. expenses
Stores expense entries linked to salary records.

**Columns:**
- `id` (uuid, primary key) - Unique expense identifier
- `user_id` (uuid, foreign key) - References users table
- `salary_record_id` (uuid, foreign key) - References salary_records table
- `category` (text, not null) - Expense category
- `amount` (numeric, >= 0) - Expense amount
- `expense_day` (integer, 1-31) - Day of month
- `expense_month` (integer, 0-11) - Month index
- `expense_year` (integer, 2000-2100) - Year
- `created_at` (timestamptz) - Record creation timestamp

**Security:** RLS enabled with policies for all CRUD operations restricted to user's own data.

## Data Isolation

Each user's data is completely isolated through Row Level Security (RLS):

1. All tables have RLS enabled
2. Policies check `user_id` against the current session context
3. CASCADE deletes ensure data integrity when users or employees are removed
4. Foreign key constraints maintain referential integrity

## Demo Account

A demo account has been pre-created for testing:

- **Email:** demo@example.com
- **Password:** demo123

## Client-Side Integration

### Database Client (`client/lib/supabase.ts`)
- Configured Supabase client with environment variables
- TypeScript type definitions for all database tables

### Database Services (`client/lib/db.ts`)

**Authentication Service:**
- `authService.register(name, email, password)` - Register new user
- `authService.login(email, password)` - Login user with bcrypt verification

**Employee Service:**
- `employeeService.getAll(userId)` - Get all employees for user
- `employeeService.create(userId, name, position)` - Create employee
- `employeeService.update(userId, employeeId, name, position)` - Update employee
- `employeeService.delete(userId, employeeId)` - Delete employee

**Salary Record Service:**
- `salaryRecordService.getAll(userId)` - Get all records with expenses
- `salaryRecordService.create(userId, employeeId, month, year, salary, expenses)` - Create/update record

## Key Features

1. **Secure Authentication:** Passwords hashed with bcryptjs (salt rounds: 10)
2. **User Isolation:** Each user can only access their own data
3. **Data Integrity:** Foreign key constraints and cascade deletes
4. **Validation:** Check constraints on amounts, dates, and ranges
5. **Audit Trail:** Created/updated timestamps on all records
6. **Optimized Queries:** Indexes on foreign keys for performance

## Migration Files

1. `create_salary_tracker_schema` - Initial schema with all tables and RLS policies
2. `add_set_config_function` - Helper function for session variable management

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

## Notes

- localStorage is still used for auth session persistence (user object only)
- Dark mode preference is stored in localStorage
- All salary and employee data is now in the database
- Real-time data sync happens on page load and after mutations
