/**
 * Centralized Dental Clinic Backend & CRM Configuration
 * Connected to Render Live Web Service
 */
const metaEnv = (import.meta as any).env || {};

export const BACKEND_URL: string = (
  metaEnv.VITE_BACKEND_URL ||
  metaEnv.VITE_API_URL ||
  'https://dentalprimeweb3.onrender.com'
).replace(/\/+$/, '');

export const CRM_PORTAL_URL: string = `${BACKEND_URL}/dashboard`;
export const CRM_LOGIN_URL: string = `${BACKEND_URL}/login`;
export const CRM_WALKIN_URL: string = `${BACKEND_URL}/walkin`;
export const CRM_ONLINE_URL: string = `${BACKEND_URL}/online`;

/**
 * Returns absolute API endpoint URL targeting the Render backend
 */
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${BACKEND_URL}${cleanEndpoint}`;
};
