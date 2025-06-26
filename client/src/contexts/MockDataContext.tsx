import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface MockDataContextType {
  useMock: boolean;
  refreshTokenCheck: () => void;
}

const MockDataContext = createContext<MockDataContextType>({ 
  useMock: true, 
  refreshTokenCheck: () => {} 
});

export const useMockData = () => useContext(MockDataContext);

export const MockDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [useMock, setUseMock] = useState(true);

  const checkToken = useCallback(async () => {
    try {
      const response = await fetch('/api/wealthbox/token');
      if (response.ok) {
        const data = await response.json();
        // If we have a token, we should use real data
        setUseMock(false);
      } else {
        // If no token or error response, use mock data
        setUseMock(true);
      }
    } catch (error) {
      console.error('Error checking token:', error);
      // If there's an error, default to mock data
      setUseMock(true);
    }
  }, []);

  // Initial token check on mount
  useEffect(() => {
    checkToken();
  }, [checkToken]);

  // Listen for authentication changes
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('Authentication changed, rechecking token...');
      checkToken();
    };

    const handleLogout = () => {
      console.log('User logged out, switching to mock data...');
      setUseMock(true);
    };

    // Listen for custom auth events
    window.addEventListener('authLogin', handleAuthChange);
    window.addEventListener('authLogout', handleLogout);
    
    return () => {
      window.removeEventListener('authLogin', handleAuthChange);
      window.removeEventListener('authLogout', handleLogout);
    };
  }, [checkToken]);

  return (
    <MockDataContext.Provider value={{ useMock, refreshTokenCheck: checkToken }}>
      {children}
    </MockDataContext.Provider>
  );
}; 