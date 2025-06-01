import axios from 'axios'
import { getSession } from 'next-auth/react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_COMPLAINTS,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.token) {
    if (config.headers) {
      config.headers['Authorization'] = `Bearer ${session.token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api
