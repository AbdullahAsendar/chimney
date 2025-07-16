import React, { createContext, useContext, useState, useEffect } from 'react';

interface EnvironmentContextType {
  isProduction: boolean;
  apiBaseUrl: string;
  toggleEnvironment: () => void;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export const useEnvironment = () => {
  const context = useContext(EnvironmentContext);
  if (context === undefined) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
};

interface EnvironmentProviderProps {
  children: React.ReactNode;
}

export const EnvironmentProvider: React.FC<EnvironmentProviderProps> = ({ children }) => {
  const [isProduction, setIsProduction] = useState(() => {
    const saved = localStorage.getItem('environment');
    return saved === 'production';
  });

  const apiBaseUrl = isProduction 
    ? 'https://api-aqari.ds.sharjah.ae'
    : import.meta.env.VITE_API_BASE_URL || 'https://api-aqari-stg.ds.sharjah.ae';

  const toggleEnvironment = () => {
    setIsProduction(prev => !prev);
  };

  useEffect(() => {
    localStorage.setItem('environment', isProduction ? 'production' : 'staging');
  }, [isProduction]);

  const value = {
    isProduction,
    apiBaseUrl,
    toggleEnvironment,
  };

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
}; 