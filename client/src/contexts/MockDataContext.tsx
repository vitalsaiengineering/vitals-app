import React, { createContext, useContext, useState, useEffect } from 'react';

interface MockDataContextType {
  useMock: boolean;
}

const MockDataContext = createContext<MockDataContextType>({ useMock: true });

export const useMockData = () => useContext(MockDataContext);

export const MockDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [useMock, setUseMock] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const response = await fetch('/api/wealthbox/token');
        if (response.ok) {
          const data = await response.json();
          // If we have a token, we should use real data
          setUseMock(false);
        }
      } catch (error) {
        console.error('Error checking token:', error);
        // If there's an error, default to mock data
        setUseMock(true);
      }
    };

    checkToken();
  }, []);

  return (
    <MockDataContext.Provider value={{ useMock }}>
      {children}
    </MockDataContext.Provider>
  );
}; 