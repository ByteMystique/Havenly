// API configuration and client
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = {
  async post(endpoint, body) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || response.statusText);
    }

    return response.json();
  },

  async get(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || response.statusText);
    }

    return response.json();
  },

  getToken() {
    const session = localStorage.getItem('session');
    if (!session) return '';
    try {
      return JSON.parse(session).access_token || '';
    } catch {
      return '';
    }
  },

  setToken(session) {
    localStorage.setItem('session', JSON.stringify(session));
  },

  clearToken() {
    localStorage.removeItem('session');
  },

  // Auth methods
  async login(email, password) {
    return this.post('/api/auth/login', { email, password });
  },

  async signup(email, password, name) {
    return this.post('/api/auth/signup', { email, password, name });
  },

  async checkHealth() {
    return this.get('/api/health');
  },

  getOAuthUrl() {
    return `${API_URL}/api/auth/oauth`;
  },
};
