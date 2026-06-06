import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || '';

// Configure default base URL for all axios requests
axios.defaults.baseURL = API_BASE;
