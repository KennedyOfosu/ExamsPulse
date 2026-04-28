import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import logo from '../assets/logo.png';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); setLoading(false); }
    else {
      setSuccess(true);
      setTimeout(async () => { await supabase.auth.signOut(); navigate('/login'); }, 2500);
    }
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

        {/* Verifying state */}
        {!ready && !success && (
          <div className="login-waiting">
            <span className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
            <span>Verifying reset link…</span>
          </div>
        )}

        {/* Success state */}
        {success && (
          <div className="login-success">
            ✓ Password updated! Redirecting to login…
          </div>
        )}

        {/* Reset form */}
        {ready && !success && (
          <form className="login-form" onSubmit={handleReset} noValidate>
            <input
              id="new-password"
              type="password"
              className="login-input"
              placeholder="New password (min. 6 characters)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
              autoComplete="new-password"
            />
            <input
              id="confirm-password"
              type="password"
              className="login-input"
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Update Password'}
            </button>
          </form>
        )}

        <div className="login-links">
          <Link to="/login" className="login-link">Back to login</Link>
        </div>
      </div>

      {/* Footer */}
      <p className="login-footer">© {new Date().getFullYear()} Cerebra. All rights reserved.</p>
    </div>
  );
}
