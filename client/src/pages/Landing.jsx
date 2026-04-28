import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Landing() {
  const [activeTab, setActiveTab] = useState('students');

  return (
    <div className="landing-shell">
      {/* Particle Background Effect in Hero */}
      <div className="landing-particles"></div>

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <img src={logo} alt="Cerebra" />
        </div>
        <div className="landing-nav-links-right">
          <Link to="/login" className="landing-nav-login">Log in</Link>
          <Link to="/register" className="landing-nav-download">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="landing-hero-center">
          <img src={logo} alt="Cerebra Logo" className="landing-hero-logo" />
          <h1 className="landing-title">
            Study Smarter,<br />Score Higher
          </h1>
          <p className="landing-subtitle">
            Upload your lecture slides, notes, or textbooks and let our AI generate tailored practice questions instantly. The new way to ace your exams.
          </p>
          <div className="landing-cta-group">
            <Link to="/register" className="landing-btn-dark">
              <span className="icon">❖</span> Get Started for Free
            </Link>
          </div>
        </div>
      </header>


    </div>
  );
}
