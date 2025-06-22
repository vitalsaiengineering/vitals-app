import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdvisorContextType {
  selectedAdvisor: string;
  setSelectedAdvisor: (advisor: string) => void;
  advisorList: string[];
}

const defaultAdvisorList = ['All Advisors', 'Jackson Miller', 'Sarah Johnson', 'Thomas Chen', 'Maria Reynolds'];

const AdvisorContext = createContext<AdvisorContextType>({
  selectedAdvisor: 'All Advisors',
  setSelectedAdvisor: () => {},
  advisorList: defaultAdvisorList,
});

export const useAdvisor = () => useContext(AdvisorContext);

export const AdvisorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>('All Advisors');
  const [advisorList, setAdvisorList] = useState<string[]>(defaultAdvisorList);

  // Load from localStorage if available
  useEffect(() => {
    const storedAdvisor = localStorage.getItem('selectedAdvisor');
    if (storedAdvisor) {
      setSelectedAdvisor(storedAdvisor);
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('selectedAdvisor', selectedAdvisor);
  }, [selectedAdvisor]);

  return (
    <AdvisorContext.Provider value={{ selectedAdvisor, setSelectedAdvisor, advisorList }}>
      {children}
    </AdvisorContext.Provider>
  );
}; 