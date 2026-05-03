import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

/* ─────────────────────────────────────────
   Floating icon pill used in the hero
───────────────────────────────────────── */
function FloatPill({ children, style }) {
  return (
    <div className="hero-float-pill" style={style}>
      {children}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="landing-shell">

      {/* ── Navbar ── */}
      <nav className="landing-nav" aria-label="Main navigation">
        <div className="landing-nav-logo">
          <img src={logo} alt="Cerebra" />
        </div>
        <div className="landing-nav-actions">
          <Link to="/login"    className="landing-nav-login">Log in</Link>
          <Link to="/register" className="landing-nav-cta">Get Started</Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════
          1. HERO
      ═══════════════════════════════════ */}
      <section className="lp-hero" aria-label="Hero">
        {/* Dot grid */}
        <div className="lp-dot-grid" aria-hidden="true" />

        {/* Ambient orbs */}
        <div className="lp-orb lp-orb--1" aria-hidden="true" />
        <div className="lp-orb lp-orb--2" aria-hidden="true" />

        {/* Floating context pills */}
        <FloatPill style={{ top: '18%', left: '7%', animationDelay: '0s' }}>
          📄 Lecture Notes
        </FloatPill>
        <FloatPill style={{ top: '28%', right: '8%', animationDelay: '1.2s' }}>
          🧠 AI Analysis
        </FloatPill>
        <FloatPill style={{ bottom: '28%', left: '10%', animationDelay: '0.6s' }}>
          ✅ Practice Questions
        </FloatPill>
        <FloatPill style={{ bottom: '22%', right: '6%', animationDelay: '1.8s' }}>
          🎯 Exam Ready
        </FloatPill>

        <div className="lp-hero-inner">
          <img src={logo} alt="Cerebra Logo" className="lp-hero-logo" />
          <h1 className="lp-hero-title">
            Ace Every Exam.<br className="lp-br" /> Study Smarter.
          </h1>
          <p className="lp-hero-sub">
            Upload your lecture notes, slides, or textbooks and let AI instantly
            generate tailored practice questions. The smartest way to prepare.
          </p>
          <div className="lp-hero-ctas">
            <Link to="/register" className="lp-btn-dark">
              <span>Get Started — it's free</span>
            </Link>
            <a href="#how-it-works" className="lp-btn-light">
              See how it works
            </a>
          </div>
          <p className="lp-proof">
            <span className="lp-proof-dot" aria-hidden="true" />
            Trusted by students across campus
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════
          2. DARK SHOWCASE — App in action
      ═══════════════════════════════════ */}
      <section className="lp-dark-showcase" id="how-it-works" aria-label="App showcase">
        <div className="lp-dark-inner">
          <p className="lp-dark-eyebrow">How it works</p>
          <h2 className="lp-dark-title">
            From notes to practice — in seconds
          </h2>
          <p className="lp-dark-sub">
            Drop in any study material and Cerebra's AI reads, understands, and
            generates exam-style questions tailored exactly to your content.
          </p>

          {/* Mock app window */}
          <div className="lp-mock-window">
            <div className="lp-mock-titlebar">
              <span className="lp-mock-dot lp-mock-dot--red"  />
              <span className="lp-mock-dot lp-mock-dot--yel"  />
              <span className="lp-mock-dot lp-mock-dot--grn"  />
              <span className="lp-mock-file">lecture_notes.pdf · Cerebra</span>
            </div>
            <div className="lp-mock-body">
              <div className="lp-mock-sidebar">
                <div className="lp-mock-sb-item lp-mock-sb-item--active">📄 Notes</div>
                <div className="lp-mock-sb-item">📊 Analytics</div>
                <div className="lp-mock-sb-item">🏆 Results</div>
              </div>
              <div className="lp-mock-content">
                <div className="lp-mock-label">AI-Generated Questions</div>
                <div className="lp-mock-q lp-mock-q--1">
                  <span className="lp-mock-qnum">Q1</span>
                  What is the primary function of mitochondria in eukaryotic cells?
                  <div className="lp-mock-options">
                    <span className="lp-mock-opt lp-mock-opt--correct">A. Energy production (ATP synthesis)</span>
                    <span className="lp-mock-opt">B. Protein synthesis</span>
                    <span className="lp-mock-opt">C. DNA replication</span>
                  </div>
                </div>
                <div className="lp-mock-q lp-mock-q--2">
                  <span className="lp-mock-qnum">Q2</span>
                  Describe the process of oxidative phosphorylation…
                  <div className="lp-mock-typing">
                    <span className="lp-mock-cursor" />
                  </div>
                </div>
                <div className="lp-mock-badge">
                  <span className="lp-mock-badge-dot" /> Generating 12 more questions…
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          3. PLATFORM DEFINITION
      ═══════════════════════════════════ */}
      <section className="lp-platform" aria-label="Platform definition">
        <div className="lp-platform-inner">
          <p className="lp-section-eyebrow">The platform</p>
          <h2 className="lp-section-title">
            Cerebra is your AI-powered exam preparation platform
          </h2>
          <p className="lp-section-sub">
            Built for students who want to study efficiently and perform
            confidently — not just study more.
          </p>

          {/* 3-step flow */}
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-icon">📤</div>
              <div className="lp-step-title">Upload</div>
              <div className="lp-step-desc">Drop in PDFs, slides, or plain text notes.</div>
            </div>
            <div className="lp-step-arrow" aria-hidden="true">→</div>
            <div className="lp-step">
              <div className="lp-step-icon">🤖</div>
              <div className="lp-step-title">Generate</div>
              <div className="lp-step-desc">AI reads and creates tailored exam questions.</div>
            </div>
            <div className="lp-step-arrow" aria-hidden="true">→</div>
            <div className="lp-step">
              <div className="lp-step-icon">🎯</div>
              <div className="lp-step-title">Practice</div>
              <div className="lp-step-desc">Answer, review, and track your progress.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          4. FEATURE CARDS
      ═══════════════════════════════════ */}
      <section className="lp-features" aria-label="Features">
        <div className="lp-features-inner">
          <p className="lp-section-eyebrow">Features</p>
          <h2 className="lp-section-title">Everything you need to ace it</h2>

          <div className="lp-feat-grid">
            <div className="lp-feat-card">
              <div className="lp-feat-icon">⚡</div>
              <h3 className="lp-feat-title">Instant Question Generation</h3>
              <p className="lp-feat-desc">
                Upload any study material and get exam-ready MCQs, short answers,
                and essays in under 30 seconds.
              </p>
            </div>
            <div className="lp-feat-card">
              <div className="lp-feat-icon">🎛️</div>
              <h3 className="lp-feat-title">Multiple Exam Modes</h3>
              <p className="lp-feat-desc">
                Practice MCQs, short-answer, or essay-style — or mix them all for
                a comprehensive revision session.
              </p>
            </div>
            <div className="lp-feat-card">
              <div className="lp-feat-icon">📊</div>
              <h3 className="lp-feat-title">Progress Tracking</h3>
              <p className="lp-feat-desc">
                See your scores, streaks, and weak spots at a glance so you know
                exactly where to focus next.
              </p>
            </div>
            <div className="lp-feat-card">
              <div className="lp-feat-icon">🔒</div>
              <h3 className="lp-feat-title">Private &amp; Secure</h3>
              <p className="lp-feat-desc">
                Your notes and questions are yours alone. We never share your
                study materials with anyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          5. BUILT FOR — Role Cards
      ═══════════════════════════════════ */}
      <section className="lp-roles" aria-label="Who it's for">
        <div className="lp-roles-inner">
          <p className="lp-section-eyebrow">Built for</p>
          <h2 className="lp-section-title">
            For the student-first era of exam prep
          </h2>

          <div className="lp-role-grid">
            <div className="lp-role-card">
              <div className="lp-role-emoji">🎓</div>
              <h3 className="lp-role-name">University Students</h3>
              <p className="lp-role-desc">
                Turn a semester's worth of notes into a targeted practice set
                the night before your exam.
              </p>
              <Link to="/register" className="lp-role-link">Get started →</Link>
            </div>
            <div className="lp-role-card">
              <div className="lp-role-emoji">📚</div>
              <h3 className="lp-role-name">Study Groups</h3>
              <p className="lp-role-desc">
                Generate a shared question bank from group notes and quiz
                each other on what matters most.
              </p>
              <Link to="/register" className="lp-role-link">Try it free →</Link>
            </div>
            <div className="lp-role-card">
              <div className="lp-role-emoji">⏳</div>
              <h3 className="lp-role-name">Last-Minute Preppers</h3>
              <p className="lp-role-desc">
                Short on time? Cerebra cuts straight to the questions most
                likely to appear — fast.
              </p>
              <Link to="/register" className="lp-role-link">Start now →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          6. FINAL CTA — 2 columns
      ═══════════════════════════════════ */}
      <section className="lp-final-cta" aria-label="Call to action">
        <div className="lp-final-inner">
          <div className="lp-final-card lp-final-card--dark">
            <p className="lp-final-tag">For students</p>
            <h3 className="lp-final-title">Achieve new heights</h3>
            <p className="lp-final-desc">
              Free to get started. No credit card required.
            </p>
            <Link to="/register" className="lp-btn-white">Get Started Free</Link>
          </div>
          <div className="lp-final-card lp-final-card--light">
            <p className="lp-final-tag">For institutions</p>
            <h3 className="lp-final-title lp-final-title--dark">
              Level up your entire class
            </h3>
            <p className="lp-final-desc lp-final-desc--dark">
              Bulk accounts and lecturer dashboards — coming soon.
            </p>
            <button className="lp-btn-outline" disabled>Notify Me — Coming Soon</button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <img src={logo} alt="Cerebra" className="lp-footer-logo" />
          <p className="lp-footer-copy">© {new Date().getFullYear()} Cerebra · ExamsPulse. All rights reserved.</p>
          <div className="lp-footer-links">
            <Link to="/login">Log in</Link>
            <Link to="/register">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
