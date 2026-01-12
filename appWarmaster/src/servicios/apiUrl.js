// src/config/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔍 API_URL configurada como:', API_URL);
console.log('🔍 VITE_API_URL:', import.meta.env.VITE_API_URL);


export default API_URL;