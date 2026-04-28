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

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="landing-hero-center">
          <img src={logo} alt="Cerebra Logo" className="landing-hero-logo" />
          <h1 className="landing-title">
            Study Smarter,<br/>Score Higher
          </h1>
          <p className="landing-subtitle">
            Upload your lecture slides, notes, or textbooks and let our AI generate tailored practice questions instantly. The new way to ace your exams.
          </p>
          <div className="landing-cta-group">
            <Link to="/register" className="landing-btn-dark">
              <span className="icon">❖</span> Get Started for Free
            </Link>
            <a href="#product" className="landing-btn-light">
              Explore features
            </a>
          </div>
        </div>
      </header>

      {/* Product Section */}
      <section id="product" className="landing-section">
        <div className="landing-container">
          <div className="section-header-left">
            <h2 className="section-title">Build confidence with AI.</h2>
            <p className="section-desc">Generate quizzes, short answers, and essay prompts directly from your course materials.</p>
          </div>
          
          <div className="product-grid">
            <div className="product-card">
              <div className="product-card-content">
                <h3>Instant Generation</h3>
                <p>Don't waste hours writing flashcards. Upload your PDF and instantly get hundreds of questions.</p>
              </div>
              <div className="product-card-visual bg-gradient-blue">
                <div className="mock-ui">
                  <div className="mock-ui-header">
                    <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                  </div>
                  <div className="mock-ui-body">
                    <div className="mock-bar w-3/4"></div>
                    <div className="mock-bar w-full"></div>
                    <div className="mock-bar w-5/6"></div>
                    <div className="mock-pulse">Generating...</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="product-card">
              <div className="product-card-content">
                <h3>Adaptive Difficulty</h3>
                <p>Our agent learns what you know and automatically scales the difficulty of questions to maximize retention.</p>
              </div>
              <div className="product-card-visual bg-gradient-purple">
                <div className="mock-chart">
                  <div className="chart-bar h-1"></div>
                  <div className="chart-bar h-2"></div>
                  <div className="chart-bar h-3"></div>
                  <div className="chart-bar h-4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="landing-section section-gray">
        <div className="landing-container center-text">
          <h2 className="section-title">Who is Cerebra for?</h2>
          <p className="section-desc centered">Whether you're cramming for a final or teaching a 500-person lecture, we've got you covered.</p>
          
          <div className="use-case-tabs">
            <button 
              className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              For Students
            </button>
            <button 
              className={`tab-btn ${activeTab === 'educators' ? 'active' : ''}`}
              onClick={() => setActiveTab('educators')}
            >
              For Educators
            </button>
            <button 
              className={`tab-btn ${activeTab === 'institutions' ? 'active' : ''}`}
              onClick={() => setActiveTab('institutions')}
            >
              For Institutions
            </button>
          </div>

          <div className="use-case-content">
            {activeTab === 'students' && (
              <div className="use-case-pane animate-fade-in">
                <h3>Ace your exams.</h3>
                <p>Turn your chaotic lecture notes into structured, high-yield practice tests.</p>
              </div>
            )}
            {activeTab === 'educators' && (
              <div className="use-case-pane animate-fade-in">
                <h3>Save hours on grading.</h3>
                <p>Generate diverse question banks to prevent cheating and automate assignment creation.</p>
              </div>
            )}
            {activeTab === 'institutions' && (
              <div className="use-case-pane animate-fade-in">
                <h3>Scale learning outcomes.</h3>
                <p>Deploy custom AI tutors securely across your entire campus infrastructure.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="landing-section">
        <div className="landing-container">
          <div className="section-header-center">
            <h2 className="section-title">Simple, transparent pricing.</h2>
            <p className="section-desc">Start for free, upgrade when you need more power.</p>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-badge">Basic</div>
              <h3 className="pricing-name">Free</h3>
              <div className="pricing-price">$0<span>/mo</span></div>
              <ul className="pricing-features">
                <li>10 Document Uploads</li>
                <li>Multiple Choice Questions</li>
                <li>Standard Support</li>
              </ul>
              <Link to="/register" className="landing-btn-light w-full-btn">Get Started</Link>
            </div>

            <div className="pricing-card featured">
              <div className="pricing-badge featured-badge">Most Popular</div>
              <h3 className="pricing-name">Pro</h3>
              <div className="pricing-price">$12<span>/mo</span></div>
              <ul className="pricing-features">
                <li>Unlimited Uploads</li>
                <li>Essay & Short Answer Grading</li>
                <li>Priority AI Processing</li>
              </ul>
              <Link to="/register" className="landing-btn-dark w-full-btn">Start Free Trial</Link>
            </div>

            <div className="pricing-card">
              <div className="pricing-badge">Enterprise</div>
              <h3 className="pricing-name">Campus</h3>
              <div className="pricing-price">Custom</div>
              <ul className="pricing-features">
                <li>LMS Integration</li>
                <li>Advanced Analytics Dashboard</li>
                <li>Dedicated Account Manager</li>
              </ul>
              <a href="mailto:contact@cerebra.com" className="landing-btn-light w-full-btn">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section id="resources" className="landing-section section-gray">
        <div className="landing-container">
          <div className="section-header-left">
            <h2 className="section-title">Resources to get you started.</h2>
          </div>
          
          <div className="resources-grid">
            <a href="#" className="resource-card">
              <div className="resource-img bg-gradient-blue"></div>
              <div className="resource-content">
                <div className="resource-meta">Documentation • 5 min read</div>
                <h3>How to write the perfect prompt for essay grading</h3>
              </div>
            </a>
            <a href="#" className="resource-card">
              <div className="resource-img bg-gradient-purple"></div>
              <div className="resource-content">
                <div className="resource-meta">Blog • 3 min read</div>
                <h3>Why active recall beats rereading your textbook</h3>
              </div>
            </a>
            <a href="#" className="resource-card">
              <div className="resource-img bg-gradient-green"></div>
              <div className="resource-content">
                <div className="resource-meta">Case Study • Video</div>
                <h3>How SIIMT students increased their GPAs by 15%</h3>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container footer-flex">
          <div className="footer-logo">
            <img src={logo} alt="Cerebra Logo" />
            <p>© 2026 Cerebra. All rights reserved.</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#">Changelog</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
