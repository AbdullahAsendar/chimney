import React, { createContext, useContext, useState, useEffect } from 'react';

type Environment = 'local' | 'dev' | 'stg' | 'prod';

interface EnvironmentContextType {
  environment: Environment;
  apiBaseUrl: string;
  toggleEnvironment: () => void;
  setEnvironment: (env: Environment) => void;
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

const ENVIRONMENT_URLS: Record<Environment, string> = {
  local: 'http://localhost:8080',
  dev: 'https://dev-api-realestate-ds.sharjah.ae',
  stg: 'https://stg-api-aqari.ds.sharjah.ae',
  prod: 'https://api-aqari.ds.sharjah.ae',
};

export const EnvironmentProvider: React.FC<EnvironmentProviderProps> = ({ children }) => {
  const [environment, setEnvironmentState] = useState<Environment>(() => {
    const saved = localStorage.getItem('environment');
    return (saved as Environment) || 'stg';
  });

  const apiBaseUrl = ENVIRONMENT_URLS[environment];

  const setEnvironment = (env: Environment) => {
    setEnvironmentState(env);
    localStorage.setItem('environment', env);
  };

  const toggleEnvironment = () => {
    const environments: Environment[] = ['local', 'dev', 'stg', 'prod'];
    const currentIndex = environments.indexOf(environment);
    const nextIndex = (currentIndex + 1) % environments.length;
    setEnvironment(environments[nextIndex]);
  };

  useEffect(() => {
    localStorage.setItem('environment', environment);
  }, [environment]);

  const value = {
    environment,
    apiBaseUrl,
    toggleEnvironment,
    setEnvironment,
  };

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
}; 