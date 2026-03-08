import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../utils/api';
import Loader from '../components/Loader';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const { login, signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Missing fields', 'Please enter email and password', 2000);
      return;
    }

    setLoadingText('Logging in...');
    setLoading(true);

    try {
      await login(loginEmail, loginPassword);
      setLoading(false);
      toast.success('Welcome back!', 'Login successful', 2000);
      setTimeout(() => navigate('/hostels'), 500);
    } catch (error) {
      setLoading(false);
      const errorMsg = error.message || 'Login failed. Please check your credentials.';
      toast.error('Login failed', errorMsg, 3000);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) {
      toast.error('Missing fields', 'Please fill in all fields', 2000);
      return;
    }

    if (signupPassword.length < 6) {
      toast.error('Weak password', 'Password must be at least 6 characters', 2000);
      return;
    }

    setLoadingText('Creating account...');
    setLoading(true);

    try {
      await signup(signupEmail, signupPassword, signupName);
      setLoading(false);
      toast.success('Account created!', 'Welcome to Havenly', 2000);
      // Clear form
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      // Navigate after a short delay
      setTimeout(() => navigate('/hostels'), 500);
    } catch (error) {
      setLoading(false);
      const errorMsg = error.message || 'Signup failed. Please try again.';
      toast.error('Signup failed', errorMsg, 3000);
    }
  };

  return (
    <div className="auth-page">
      {loading && <Loader text={loadingText} />}
      <div className="auth-container">
        {isLogin ? (
          <div className="form-container">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input
                  type="email"
                  id="login-email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <input
                  type="password"
                  id="login-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn">
                Login
              </button>
            </form>
            <p className="toggle-text">
              Don&apos;t have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(false); }}>
                Sign up
              </a>
            </p>
            <div className="auth-divider"><span>or</span></div>
            <a href={apiClient.getOAuthUrl()} className="btn-oauth">
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.9 23.9 0 000 24c0 3.77.9 7.35 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continue with Google
            </a>
          </div>
        ) : (
          <div className="form-container">
            <h2>Sign Up</h2>
            <form onSubmit={handleSignup}>
              <div className="form-group">
                <label htmlFor="signup-name">Name</label>
                <input
                  type="text"
                  id="signup-name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-email">Email</label>
                <input
                  type="email"
                  id="signup-email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <input
                  type="password"
                  id="signup-password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn">
                Sign Up
              </button>
            </form>
            <p className="toggle-text">
              Already have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(true); }}>
                Login
              </a>
            </p>
            <div className="auth-divider"><span>or</span></div>
            <a href={apiClient.getOAuthUrl()} className="btn-oauth">
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.9 23.9 0 000 24c0 3.77.9 7.35 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continue with Google
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
