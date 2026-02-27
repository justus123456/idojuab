// config.js - Set API URL based on environment
let API_URL;

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Local development
  API_URL = 'http://localhost:3000';
} else {
  // Production - change this to your deployed API URL when deploying
  // Example: API_URL = 'https://api.yourdomain.com';
  API_URL = window.location.origin; // Default to same origin
}

export const getApiUrl = () => API_URL;
