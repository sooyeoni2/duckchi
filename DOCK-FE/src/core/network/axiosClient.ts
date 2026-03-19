import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/apiConstants';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});
