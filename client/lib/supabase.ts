import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password?: string;
          name?: string;
          created_at?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          position: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          position: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          position?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      salary_records: {
        Row: {
          id: string;
          user_id: string;
          employee_id: string;
          month: number;
          year: number;
          salary: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          employee_id: string;
          month: number;
          year: number;
          salary: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          employee_id?: string;
          month?: number;
          year?: number;
          salary?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          salary_record_id: string;
          category: string;
          amount: number;
          expense_day: number;
          expense_month: number;
          expense_year: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          salary_record_id: string;
          category: string;
          amount: number;
          expense_day: number;
          expense_month: number;
          expense_year: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          salary_record_id?: string;
          category?: string;
          amount?: number;
          expense_day?: number;
          expense_month?: number;
          expense_year?: number;
          created_at?: string;
        };
      };
    };
  };
}
