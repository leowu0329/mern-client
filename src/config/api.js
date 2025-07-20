// API 設定
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  ITEMS: `${API_BASE_URL}/api/items`,
};

export default API_BASE_URL;
