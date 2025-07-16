import { useEnvironment } from '../contexts/EnvironmentContext';

export const getApiBaseUrl = () => {
  // This function will be used in components that need the API base URL
  // Components should use the useEnvironment hook directly for better reactivity
  return import.meta.env.VITE_API_BASE_URL || 'https://api-aqari-stg.ds.sharjah.ae';
};

export const getProductionApiBaseUrl = () => {
  return 'https://api-aqari.ds.sharjah.ae';
};

export const getStagingApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'https://api-aqari-stg.ds.sharjah.ae';
}; 