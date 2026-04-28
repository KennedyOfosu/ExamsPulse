import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import logo from '../assets/logo.png';

export default function Register() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    });
    if (err) { setError(err.message); setLoading(false); }
    else navigate('/');
  };

  return (
    <div className="login-shell">
      {/* Ambient glows */}
      <div className="login-glow login-glow--blue" />
      <div className="login-glow login-glow--purple" />

      {/* Decorative squares */}
      <span className="login-sq login-sq--1" />
      <span className="login-sq login-sq--2" />
      <span className="login-sq login-sq--3" />
      <span className="login-sq login-sq--4" />

      {/* Brand — pinned to top */}
      <div className="login-brand">
        <img src={logo} alt="Cerebra" className="login-brand-img" />
      </div>

      {/* Centered form */}
      <div className="login-center">

        {error && <div className="login-error">⚠ {error}</div>}

        <form className="login-form" onSubmit={handleRegister} noValidate>
          <input
            id="reg-name"
            type="text"
            className="login-input"
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoComplete="name"
          />
          <input
            id="reg-email"
            type="email"
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            id="reg-password"
            type="password"
            className="login-input"
            placeholder="Password (min. 6 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <div className="login-links">
          <Link to="/login" className="login-link">Already have an account?</Link>
        </div>
      </div>

      {/* Footer */}
      <p className="login-footer">© {new Date().getFullYear()} ExamsPulse. All rights reserved.</p>
    </div>
  );
}
