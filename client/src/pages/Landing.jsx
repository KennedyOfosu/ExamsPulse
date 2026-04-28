import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function Landing() {
  return (
    <div className="landing-shell">
      {/* Particle Background Effect */}
      <div className="landing-particles"></div>

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <img src={logo} alt="Cerebra" />
        </div>
        <div className="landing-nav-links-center">
          <a href="#product">Product</a>
          <a href="#use-cases">Use Cases</a>
          <a href="#pricing">Pricing</a>
          <a href="#resources">Resources</a>
        </div>
        <div className="landing-nav-links-right">
          <Link to="/login" className="landing-nav-login">Log in</Link>
          <Link to="/register" className="landing-nav-download">Get Started</Link>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="landing-hero">
        <div className="landing-hero-center">
          <img src={logo} alt="Cerebra Logo" className="landing-hero-logo" />
          <h1 className="landing-title">
            Experience liftoff with the<br/>next-gen learning platform
          </h1>
          <p className="landing-subtitle">
            Upload your lecture slides, notes, or textbooks and let our AI generate tailored practice questions instantly. Study smarter, not harder.
          </p>
          <div className="landing-cta-group">
            <Link to="/register" className="landing-btn-dark">
              <span className="icon">❖</span> Get Started for Free
            </Link>
            <Link to="/login" className="landing-btn-light">
              Explore features
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
