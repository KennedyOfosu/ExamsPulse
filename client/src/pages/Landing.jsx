import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Landing() {
  return (
    <div className="landing-shell">

      {/* Animated dot grid background */}
      <div className="landing-dot-grid" aria-hidden="true" />

      {/* Subtle ambient glow orbs */}
      <div className="landing-orb landing-orb--1" aria-hidden="true" />
      <div className="landing-orb landing-orb--2" aria-hidden="true" />

      {/* ── Navigation ── */}
      <nav className="landing-nav" aria-label="Main navigation">
        <div className="landing-nav-logo">
          <img src={logo} alt="Cerebra" />
        </div>
        <div className="landing-nav-actions">
          <Link to="/login" className="landing-nav-login">Log in</Link>
          <Link to="/register" className="landing-nav-cta">Get Started</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="landing-hero" role="main">
        <div className="landing-hero-inner">

          {/* Big centered logo — Google-style */}
          <div className="landing-logo-wrap">
            <img src={logo} alt="Cerebra Logo" className="landing-hero-logo" />
          </div>

          {/* Headline */}
          <h1 className="landing-title">
            Study Smarter,<br className="landing-br" /> Score Higher
          </h1>

          {/* Sub-text */}
          <p className="landing-subtitle">
            Upload your lecture notes, slides, or textbooks and let AI instantly
            generate tailored practice questions. The new way to ace your exams.
          </p>

          {/* CTA */}
          <div className="landing-cta-wrap">
            <Link to="/register" className="landing-btn-primary">
              Get Started — it&apos;s free
            </Link>
            <Link to="/login" className="landing-btn-ghost">
              Sign in
            </Link>
          </div>

          {/* Social proof pill */}
          <p className="landing-proof">
            <span className="landing-proof-dot" />
            Trusted by students across campus
          </p>

        </div>
      </main>

    </div>
  );
}
