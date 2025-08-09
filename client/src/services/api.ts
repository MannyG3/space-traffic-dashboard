import axios from 'axios';
import { Satellite, Alert, Stats } from '../types';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : (process.env.REACT_APP_API_URL || 'http://localhost:5000');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const satelliteAPI = {
  getAll: async (): Promise<Satellite[]> => {
    const response = await api.get('/api/satellites');
    return response.data;
  },
};

export const alertAPI = {
  getAll: async (): Promise<Alert[]> => {
    const response = await api.get('/api/alerts');
    return response.data;
  },
};

export const statsAPI = {
  getStats: async (): Promise<Stats> => {
    const response = await api.get('/api/stats');
    return response.data;
  },
};

export default api;
