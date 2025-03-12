import React, { useState, useEffect } from 'react';
import { User } from './types'; // Assuming this type is defined elsewhere

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
          console.log('User data:', userData); // Add logging to debug
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

  if (loading) {
    return <p>Loading...</p>; // Or a more sophisticated loading indicator
  }

  return <>{children}</>;
}