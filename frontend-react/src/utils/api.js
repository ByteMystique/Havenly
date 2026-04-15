// Thin auth-token helper — HTTP is handled by dataService
const API_URL   = import.meta.env.VITE_API_URL  || 'http://localhost:3000';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

function makeDemoSession(email, name) {
  return {
    access_token: 'demo-token-' + Date.now(),
    user: {
      id: 'demo-user-' + Date.now(),
      email,
      user_metadata: { full_name: name || email.split('@')[0] },
      created_at: new Date().toISOString(),
    },
  };
}

export const apiClient = {
  getToken()        { try { return JSON.parse(localStorage.getItem('session'))?.access_token || ''; } catch { return ''; } },
  setToken(session) { localStorage.setItem('session', JSON.stringify(session)); },
  clearToken()      { localStorage.removeItem('session'); localStorage.removeItem('userRole'); },
  isDemoMode:       () => DEMO_MODE,

  async login(email, password) {
    if (DEMO_MODE) {
      await new Promise(r => setTimeout(r, 400));
      return { session: makeDemoSession(email), role: localStorage.getItem('userRole') || 'student' };
    }
    const res  = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data; // { session, role }
  },

  async signup(email, password, name, role = 'student') {
    if (DEMO_MODE) {
      await new Promise(r => setTimeout(r, 400));
      const session = makeDemoSession(email, name);
      return { session, user: session.user };
    }
    const res  = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    return data;
  },

  async checkHealth() {
    if (DEMO_MODE) return { ok: true, message: 'Demo mode' };
    try {
      const res = await fetch(`${API_URL}/api/health`);
      return res.json();
    } catch { return { ok: false }; }
  },

  getOAuthUrl() {
    if (DEMO_MODE) return '#';
    return `${API_URL}/api/auth/oauth`;
  },
};
