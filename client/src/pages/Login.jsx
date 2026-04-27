import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); }
    else navigate('/');
  };

  return (
    <div className="login-shell">
      {/* Ambient background glow */}
      <div className="login-glow login-glow--blue" />
      <div className="login-glow login-glow--purple" />

      {/* Decorative floating squares */}
      <span className="login-sq login-sq--1" />
      <span className="login-sq login-sq--2" />
      <span className="login-sq login-sq--3" />
      <span className="login-sq login-sq--4" />

      {/* Brand — pinned to the top, well above the form */}
      <div className="login-brand">
        <span className="login-brand-icon">⚡</span>
        <span className="login-brand-name">ExamsPulse</span>
      </div>

      {/* Centered form */}
      <div className="login-center">
        {error && (
          <div className="login-error">⚠ {error}</div>
        )}

        <form className="login-form" onSubmit={handleLogin} noValidate>
          <input
            id="login-email"
            type="email"
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            id="login-password"
            type="password"
            className="login-input"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Login'}
          </button>
        </form>

        <div className="login-links">
          <Link to="/register" className="login-link">Create an account</Link>
          <span className="login-links-sep">·</span>
          <Link to="/reset-password" className="login-link">Forgot password?</Link>
        </div>
      </div>

      {/* Footer */}
      <p className="login-footer">© {new Date().getFullYear()} ExamsPulse. All rights reserved.</p>
    </div>
  );
}
