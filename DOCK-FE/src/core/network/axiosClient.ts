import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/apiConstants';
import { attachAuthHeader } from './interceptors/authInterceptor';
import { createAuthErrorHandler } from './interceptors/errorInterceptor';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(attachAuthHeader);
axiosClient.interceptors.response.use(
  response => response,
  createAuthErrorHandler(axiosClient),
);
