import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Employee {
  id: string;
  user_id: string;
  name: string;
  position: string;
}

export interface SalaryRecord {
  id: string;
  user_id: string;
  employee_id: string;
  month: number;
  year: number;
  salary: number;
}

export interface Expense {
  id: string;
  user_id: string;
  salary_record_id: string;
  category: string;
  amount: number;
  expense_day: number;
  expense_month: number;
  expense_year: number;
}

export interface SalaryRecordWithExpenses extends SalaryRecord {
  expenses: Expense[];
}

export const authService = {
  async register(name: string, email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword
      })
      .select('id, email, name')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Email already registered');
      }
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Failed to create user');
    }

    return data;
  },

  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, password')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(password, data.password);
    if (!passwordMatch) {
      throw new Error('Invalid email or password');
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name
    };
  }
};

export const employeeService = {
  async getAll(userId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  async create(userId: string, name: string, position: string): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert({
        user_id: userId,
        name,
        position
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async update(userId: string, employeeId: string, name: string, position: string): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update({
        name,
        position
      })
      .eq('id', employeeId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async delete(userId: string, employeeId: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  }
};

export const salaryRecordService = {
  async getAll(userId: string): Promise<SalaryRecordWithExpenses[]> {
    const { data: records, error: recordsError } = await supabase
      .from('salary_records')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (recordsError) {
      throw new Error(recordsError.message);
    }

    if (!records || records.length === 0) {
      return [];
    }

    const recordIds = records.map(r => r.id);
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .in('salary_record_id', recordIds)
      .eq('user_id', userId);

    if (expensesError) {
      throw new Error(expensesError.message);
    }

    const expensesByRecord = (expenses || []).reduce((acc, expense) => {
      if (!acc[expense.salary_record_id]) {
        acc[expense.salary_record_id] = [];
      }
      acc[expense.salary_record_id].push(expense);
      return acc;
    }, {} as Record<string, Expense[]>);

    return records.map(record => ({
      ...record,
      expenses: expensesByRecord[record.id] || []
    }));
  },

  async create(
    userId: string,
    employeeId: string,
    month: number,
    year: number,
    salary: number,
    expenses: Array<{
      category: string;
      amount: number;
      expense_day: number;
      expense_month: number;
      expense_year: number;
    }>
  ): Promise<SalaryRecordWithExpenses> {
    const { data: existingRecord } = await supabase
      .from('salary_records')
      .select('id')
      .eq('user_id', userId)
      .eq('employee_id', employeeId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    let recordId: string;

    if (existingRecord) {
      const { data, error } = await supabase
        .from('salary_records')
        .update({ salary })
        .eq('id', existingRecord.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      await supabase
        .from('expenses')
        .delete()
        .eq('salary_record_id', existingRecord.id)
        .eq('user_id', userId);

      recordId = data.id;
    } else {
      const { data, error } = await supabase
        .from('salary_records')
        .insert({
          user_id: userId,
          employee_id: employeeId,
          month,
          year,
          salary
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      recordId = data.id;
    }

    if (expenses.length > 0) {
      const expenseRecords = expenses.map(expense => ({
        user_id: userId,
        salary_record_id: recordId,
        ...expense
      }));

      const { error: expensesError } = await supabase
        .from('expenses')
        .insert(expenseRecords);

      if (expensesError) {
        throw new Error(expensesError.message);
      }
    }

    const { data: finalRecord, error: finalError } = await supabase
      .from('salary_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (finalError) {
      throw new Error(finalError.message);
    }

    const { data: finalExpenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('salary_record_id', recordId)
      .eq('user_id', userId);

    return {
      ...finalRecord,
      expenses: finalExpenses || []
    };
  }
};
