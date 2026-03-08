import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { login as apiLogin, signup as apiSignup } from "../api/auth";
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

  // validation helper
  const emailRegex =/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const handleLogin = async (e) => {
  e.preventDefault();

  if (!emailRegex.test(loginEmail)) {
    toast.error("Invalid Email", "Enter a valid email");
    return;
  }

  try {
    setLoadingText("Logging in...");
    setLoading(true);

    const res = await apiLogin({
      email: loginEmail,
      password: loginPassword
    });

    login(loginEmail, res.user.id);

    toast.success("Welcome back!", "Login successful", 2000);

    setTimeout(() => navigate("/hostels"), 500);

  } catch (err) {
    toast.error("Login Failed", err.message || "Invalid credentials");
  } finally {
    setLoading(false);
  }
 };

const handleSignup = async (e) => {
  e.preventDefault();

  if (!emailRegex.test(signupEmail)) {
    toast.error("Invalid Email", "Please enter a valid email address");
    return;
  }

  if (!validatePassword(signupPassword)) {
    toast.error(
      "Weak Password",
      "Password must be 8+ chars with upper, lower and number"
    );
    return;
  }

  try {
    setLoadingText("Creating account...");
    setLoading(true);

    await apiSignup({
      email: signupEmail,
      password: signupPassword
    });

    toast.success(
      "Account created!",
      "Please verify your email before logging in.",
      4000
    );

    // switch back to login screen
    setIsLogin(true);

  } catch (err) {
    toast.error("Signup Failed", err.message || "Unable to create account");
  } finally {
    setLoading(false);
  }
};

  function validatePassword(password) {
  const strong =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  return strong.test(password);
  }

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
          </div>
        )}
      </div>
    </div>
  );
}
