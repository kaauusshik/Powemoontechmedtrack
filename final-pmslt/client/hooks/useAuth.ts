import { useState, useEffect, useCallback } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const STORAGE_KEY = "auth_user";
const USERS_KEY = "registered_users";

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        // Get registered users from localStorage
        const usersData = localStorage.getItem(USERS_KEY);
        const users = usersData ? JSON.parse(usersData) : [];

        // Find user with matching email and password
        const foundUser = users.find(
          (u: any) => u.email === email && u.password === password
        );

        if (!foundUser) {
          throw new Error("Invalid email or password");
        }

        const loggedInUser: User = {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
        };

        setUser(loggedInUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Login failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!name || !email || !password) {
          throw new Error("All fields are required");
        }

        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error("Please enter a valid email address");
        }

        // Get registered users from localStorage
        const usersData = localStorage.getItem(USERS_KEY);
        const users = usersData ? JSON.parse(usersData) : [];

        // Check if email already exists
        if (users.some((u: any) => u.email === email)) {
          throw new Error("Email already registered");
        }

        // Create new user
        const newUser = {
          id: Date.now().toString(),
          name,
          email,
          password, // In production, this should be hashed on backend
        };

        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));

        // Auto-login after registration
        const loggedInUser: User = {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        };

        setUser(loggedInUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Registration failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    user,
    login,
    register,
    logout,
    isLoading,
    error,
  };
};
