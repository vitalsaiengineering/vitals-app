import React, { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: false });

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    async function fetchUser() {
      try {
        const response = await fetch('/api/me');
        if (response.ok) {
          const userData = await response.json();
          console.log('User data:', userData);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  const value = {
    user,
    loading
  };

  if (loading) {
    return <p>Loading...</p>; // Or a more sophisticated loading indicator
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}