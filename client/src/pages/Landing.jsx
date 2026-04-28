import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Landing() {
  return (
    <div className="landing-shell">
      {/* Background ambient glows */}
      <div className="landing-glow landing-glow--1" />
      <div className="landing-glow landing-glow--2" />
      
      {/* Anti-gravity decorative shapes */}
      <div className="anti-gravity-shape shape-1" />
      <div className="anti-gravity-shape shape-2" />
      <div className="anti-gravity-shape shape-3" />
      <div className="anti-gravity-shape shape-4" />

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <img src={logo} alt="Cerebra" />
        </div>
        <div className="landing-nav-links">
          <Link to="/login" className="landing-btn-outline">Log in</Link>
          <Link to="/register" className="landing-btn-primary">Sign up free</Link>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-badge">✨ Introducing Cerebra AI</div>
          <h1 className="landing-title">
            Master your exams with <span className="text-gradient">Intelligent Prep</span>
          </h1>
          <p className="landing-subtitle">
            Upload your lecture slides, notes, or textbooks and let our AI generate tailored practice questions instantly. Study smarter, not harder.
          </p>
          <div className="landing-cta-group">
            <Link to="/register" className="landing-btn-massive">
              Start Learning Now
            </Link>
            <Link to="/login" className="landing-btn-secondary">
              I already have an account
            </Link>
          </div>
        </div>
        
        {/* Abstract 3D Mockup / Floating Card */}
        <div className="landing-mockup-wrapper">
          <div className="landing-mockup">
            <div className="mockup-header">
              <span className="dot dot-r"></span>
              <span className="dot dot-y"></span>
              <span className="dot dot-g"></span>
            </div>
            <div className="mockup-body">
              <div className="mockup-line w-3/4"></div>
              <div className="mockup-line w-full"></div>
              <div className="mockup-line w-5/6"></div>
              <div className="mockup-box">
                <div className="mockup-icon">⚡</div>
                <div className="mockup-text">Generating custom MCQ questions...</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
