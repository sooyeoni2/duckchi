import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/apiConstants';
import { getAccessToken } from './tokenManager';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
