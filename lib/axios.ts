import axios from 'axios';
import { getCookie } from 'cookies-next';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_COMPLAINTS,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 👉 ดึง accessToken จาก cookie แล้วแนบใส่ header
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const accessToken = getCookie('accessToken');
    if (accessToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
