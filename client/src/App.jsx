import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Session from './pages/Session.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

function PrivateRoute({ user, children }) {
  if (user === undefined) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function AuthHandler({ setUser }) {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') navigate('/reset-password');
    });
    return () => subscription.unsubscribe();
  }, []);
  return null;
}

export default function App() {
  const [user, setUser] = useState(undefined);
  const [theme, setTheme] = useState(() => localStorage.getItem('ep-theme') || 'dark');
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('ep-sidebar') === 'true');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ep-theme', theme);
  }, [theme]);

  useEffect(() => {
    const w = collapsed ? '44px' : '180px';
    document.documentElement.style.setProperty('--sidebar-width', w);
    document.body.classList.toggle('sb-collapsed', collapsed);
    localStorage.setItem('ep-sidebar', collapsed);
  }, [collapsed]);

  const ui = {
    theme,
    onThemeToggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark'),
    collapsed,
    onCollapse: () => setCollapsed(c => !c),
  };

  return (
    <BrowserRouter>
      <AuthHandler setUser={setUser} />
      <Routes>
        <Route path="/login"          element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register"       element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/"               element={<PrivateRoute user={user}><Dashboard user={user} {...ui} /></PrivateRoute>} />
        <Route path="/session/:id"    element={<PrivateRoute user={user}><Session user={user} {...ui} /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
