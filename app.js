// ── ExamsPulse App Logic ──

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ── STATE ──
let currentUser = null;
let sessions = [];
let activeSessionId = null;
let selectedExamType = 'mixed';
let generatedData = null;
let retryNotes = '';
let retryApiKey = '';
let retryCourse = '';

// ── INIT ──
window.addEventListener('DOMContentLoaded', () => {
  seedDemoAccount();
  currentUser = loadJSON('ep_current_user');
  sessions = loadJSON('ep_sessions') || [];
  if (currentUser) bootApp();
  else showView('auth');

  // Char counter
  const notes = document.getElementById('cfg-notes');
  if (notes) notes.addEventListener('input', updateCharCount);
});

// Seeds demo account once if it doesn't exist
function seedDemoAccount() {
  const users = loadJSON('ep_users') || [];
  const demoEmail = 'demo@examspulse.app';
  if (!users.find(u => u.email === demoEmail)) {
    users.push({ name: 'Demo Student', email: demoEmail, password: 'demo1234' });
    saveJSON('ep_users', users);
  }
}

// Fill sign-in form with demo credentials
function fillDemo() {
  switchAuthTab('signin');
  document.getElementById('si-email').value = 'demo@examspulse.app';
  document.getElementById('si-password').value = 'demo1234';
}

// ── VIEWS ──
function showView(view) {
  document.getElementById('auth-view').classList.toggle('hidden', view !== 'auth');
  document.getElementById('app-view').classList.toggle('hidden', view !== 'app');
}
function showHomeView() {
  hide('results-view');
  show('home-view');
  activeSessionId = null;
  renderSessions();
  // Restore saved API key for this user
  const savedKey = currentUser ? (loadJSON('ep_apikey_' + currentUser.email) || '') : '';
  const keyEl = document.getElementById('home-api-key');
  if (keyEl && savedKey) keyEl.value = savedKey;
}
function startNewSession() {
  hide('results-view');
  show('home-view');
  // Clear textarea but keep course/api-key for convenience
  const notes = document.getElementById('home-notes');
  if (notes) notes.value = '';
  updateHomeCharCount();
  // Reset chip selection to mixed
  document.querySelectorAll('.exam-chip').forEach(b => b.classList.toggle('active', b.dataset.type === 'mixed'));
  selectedExamType = 'mixed';
  setHomeError('');
  activeSessionId = null;
  renderSessions();
}
function bootApp() {
  showView('app');
  document.getElementById('user-name').textContent = currentUser.name;
  document.getElementById('user-email').textContent = currentUser.email;
  document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
  // Set greeting name
  const fn = currentUser.name.split(' ')[0];
  const greet = document.getElementById('greeting-name');
  if (greet) greet.textContent = fn;
  sessions = loadJSON('ep_sessions') || [];
  renderSessions();
  showHomeView();
  // Load saved API key
  const savedKey = loadJSON('ep_apikey_' + currentUser.email) || '';
  const keyEl = document.getElementById('home-api-key');
  if (keyEl && savedKey) keyEl.value = savedKey;
  // Wire textarea char counter
  const notes = document.getElementById('home-notes');
  if (notes) notes.addEventListener('input', updateHomeCharCount);
}

// ── AUTH ──
function switchAuthTab(tab) {
  document.getElementById('tab-signin').classList.toggle('active', tab === 'signin');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('signin-form').classList.toggle('hidden', tab !== 'signin');
  document.getElementById('signup-form').classList.toggle('hidden', tab !== 'signup');
}

function handleSignIn(e) {
  e.preventDefault();
  const email = val('si-email').trim().toLowerCase();
  const password = val('si-password');
  const users = loadJSON('ep_users') || [];
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) { setError('signin-error', 'Invalid email or password.'); return; }
  setError('signin-error', '');
  saveJSON('ep_current_user', user);
  currentUser = user;
  bootApp();
}

function handleSignUp(e) {
  e.preventDefault();
  const name = val('su-name').trim();
  const email = val('su-email').trim().toLowerCase();
  const password = val('su-password');
  if (!name || !email || !password) { setError('signup-error', 'Please fill all fields.'); return; }
  const users = loadJSON('ep_users') || [];
  if (users.find(u => u.email === email)) { setError('signup-error', 'Email already registered.'); return; }
  const user = { name, email, password };
  users.push(user);
  saveJSON('ep_users', users);
  saveJSON('ep_current_user', user);
  setError('signup-error', '');
  currentUser = user;
  bootApp();
}

function handleLogout() {
  localStorage.removeItem('ep_current_user');
  currentUser = null;
  sessions = [];
  activeSessionId = null;
  showView('auth');
  switchAuthTab('signin');
}

// ── SESSIONS ──
function renderSessions() {
  const list = document.getElementById('sessions-list');
  const userSessions = sessions.filter(s => s.userEmail === currentUser.email).reverse();
  if (!userSessions.length) {
    list.innerHTML = '<div class="sessions-empty">No sessions yet</div>';
    return;
  }
  list.innerHTML = userSessions.map(s => `
    <div class="session-item ${s.id === activeSessionId ? 'active' : ''}" onclick="loadSession('${s.id}')">
      <div class="si-title">${escHtml(s.title)}</div>
      <div class="si-meta">${s.examType} · ${s.date}</div>
    </div>`).join('');
}

function loadSession(id) {
  const session = sessions.find(s => s.id === id);
  if (!session) return;
  activeSessionId = id;
  generatedData = session.data;
  retryNotes = session.notes;
  retryApiKey = session.apiKey;
  retryCourse = session.title;
  renderSessions();
  showResultsView(session.title, session.examType, session.data);
}

function saveSession(title, examType, apiKey, notes, data) {
  const id = Date.now().toString();
  const session = {
    id, title, examType, apiKey, notes, data,
    userEmail: currentUser.email,
    date: new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short' })
  };
  sessions.push(session);
  saveJSON('ep_sessions', sessions);
  activeSessionId = id;
  renderSessions();
}

// ── EXAM TYPE ──
function selectExamType(btn) {
  document.querySelectorAll('.exam-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedExamType = btn.dataset.type;
}
function selectExamTypeByValue(type) {
  document.querySelectorAll('.exam-type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === type);
  });
  selectedExamType = type;
}

// ── GENERATE ──
async function handleGenerate() {
  const course = val('cfg-course').trim() || 'My Course';
  const notes = val('cfg-notes').trim();
  const apiKey = val('cfg-api-key').trim();

  if (!apiKey) { setConfigError('Please enter your Gemini API key.'); return; }
  if (notes.length < 80) { setConfigError('Please paste at least 80 characters of course material.'); return; }

  retryNotes = notes;
  retryApiKey = apiKey;
  retryCourse = course;

  setConfigError('');
  setGenerating(true);

  hide('config-panel');
  show('results-view');
  hide('empty-state');
  document.getElementById('rv-title').textContent = course;
  document.getElementById('rv-meta').textContent = labelForType(selectedExamType);
  showLoading(true);
  animateSteps();

  try {
    const prompt = buildPrompt(notes, course, selectedExamType);
    const raw = await callGemini(apiKey, prompt);
    const data = parseJSON(raw);
    generatedData = data;
    saveSession(course, labelForType(selectedExamType), apiKey, notes, data);
    showLoading(false);
    renderResults(data);
    // Switch to first available tab
    const firstTab = document.querySelector('.rv-tab');
    if (firstTab) { switchResultTab(firstTab); }
  } catch (err) {
    showLoading(false);
    hide('results-view');
    show('config-panel');
    setConfigError('Error: ' + (err.message || 'Failed to generate. Check your API key.'));
  } finally {
    setGenerating(false);
  }
}

// ── HOME GENERATE ──
async function handleHomeGenerate() {
  const course = (document.getElementById('home-course')?.value || '').trim() || 'My Course';
  const notes  = (document.getElementById('home-notes')?.value || '').trim();
  const apiKey = (document.getElementById('home-api-key')?.value || '').trim();

  if (!apiKey) { setHomeError('Please enter your Gemini API key.'); return; }
  if (notes.length < 80) { setHomeError('Please paste at least 80 characters of course material.'); return; }

  // Save API key per user
  if (currentUser) saveJSON('ep_apikey_' + currentUser.email, apiKey);

  setHomeError('');
  retryNotes  = notes;
  retryApiKey = apiKey;
  retryCourse = course;

  const btn = document.getElementById('home-gen-btn');
  const spinner = document.getElementById('home-gen-spinner');
  const icon  = document.getElementById('home-send-icon');
  btn.disabled = true;
  spinner.classList.remove('hidden');
  icon.classList.add('hidden');

  hide('home-view');
  show('results-view');
  document.getElementById('rv-title').textContent = course;
  document.getElementById('rv-meta').textContent = labelForType(selectedExamType);
  showLoading(true);
  animateSteps();

  try {
    const prompt = buildPrompt(notes, course, selectedExamType);
    const raw  = await callGemini(apiKey, prompt);
    const data = parseJSON(raw);
    generatedData = data;
    saveSession(course, labelForType(selectedExamType), apiKey, notes, data);
    showLoading(false);
    renderResults(data);
    const firstTab = document.querySelector('.rv-tab');
    if (firstTab) switchResultTab(firstTab);
  } catch (err) {
    showLoading(false);
    hide('results-view');
    show('home-view');
    setHomeError('Error: ' + (err.message || 'Failed to generate. Check your API key.'));
  } finally {
    btn.disabled = false;
    spinner.classList.add('hidden');
    icon.classList.remove('hidden');
  }
}

function setHomeError(msg) {
  const el = document.getElementById('home-error');
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('hidden', !msg);
}

function updateHomeCharCount() {
  const notes = document.getElementById('home-notes');
  const ct = document.getElementById('home-char-count');
  if (ct) ct.textContent = (notes?.value.length || 0).toLocaleString() + ' chars';
}

function selectChip(btn) {
  document.querySelectorAll('.exam-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedExamType = btn.dataset.type;
}

function toggleHomeKeyVis() {
  const inp = document.getElementById('home-api-key');
  const btn = document.getElementById('card-key-toggle');
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}
async function handleRetry() {
  if (!retryApiKey || !retryNotes) { startNewSession(); return; }

  hide('home-view');
  show('results-view');
  showLoading(true);
  animateSteps();

  try {
    const prompt = buildPrompt(retryNotes, retryCourse, selectedExamType);
    const raw = await callGemini(retryApiKey, prompt);
    const data = parseJSON(raw);
    generatedData = data;
    saveSession(retryCourse + ' (Retry)', labelForType(selectedExamType), retryApiKey, retryNotes, data);
    showLoading(false);
    renderResults(data);
    const firstTab = document.querySelector('.rv-tab');
    if (firstTab) switchResultTab(firstTab);
  } catch (err) {
    showLoading(false);
    alert('Retry failed: ' + (err.message || 'Unknown error.'));
  }
}

function setGenerating(on) {
  const btn = document.getElementById('generate-btn');
  const label = document.getElementById('gen-btn-label');
  const spinner = document.getElementById('gen-spinner');
  btn.disabled = on;
  label.textContent = on ? 'Generating…' : 'Generate Exam Questions';
  spinner.classList.toggle('hidden', !on);
}

function showLoading(on) {
  document.getElementById('rv-loading').classList.toggle('hidden', !on);
  document.querySelectorAll('.q-pane').forEach(p => p.classList.toggle('hidden', on));
}

function animateSteps() {
  const steps = ['ls1','ls2','ls3','ls4','ls5'];
  steps.forEach(id => { const el = document.getElementById(id); if(el) { el.classList.remove('active','done'); } });
  let i = 0;
  const iv = setInterval(() => {
    if (i > 0) { const prev = document.getElementById(steps[i-1]); if(prev) { prev.classList.remove('active'); prev.classList.add('done'); } }
    if (i < steps.length) { const cur = document.getElementById(steps[i]); if(cur) cur.classList.add('active'); i++; }
    else clearInterval(iv);
  }, 1600);
}

// ── RESULTS ──
function showResultsView(title, meta, data) {
  hide('home-view');
  show('results-view');
  document.getElementById('rv-title').textContent = title;
  document.getElementById('rv-meta').textContent = meta;
  showLoading(false);
  renderResults(data);
  const firstTab = document.querySelector('.rv-tab');
  if (firstTab) switchResultTab(firstTab);
}

function switchResultTab(btn) {
  document.querySelectorAll('.rv-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const tab = btn.dataset.tab;
  document.querySelectorAll('.q-pane').forEach(p => p.classList.add('hidden'));
  const pane = document.getElementById(tab + '-pane');
  if (pane) pane.classList.remove('hidden');
}

function renderResults(data) {
  renderMCQ(data.mcq || []);
  renderShort(data.short || []);
  renderEssay(data.essay || []);
  renderFill(data.fill || []);
  renderTopics(data.topics || []);
}

function badge(l) {
  const map = { high:['High','high'], mid:['Moderate','mid'], low:['Lower','low'] };
  const [label, cls] = map[l] || ['Unranked','low'];
  return `<span class="q-badge ${cls}">${label} likelihood</span>`;
}

function renderMCQ(qs) {
  const pane = document.getElementById('mcq-pane');
  pane.innerHTML = '';
  if (!qs.length) { pane.innerHTML = empty('No MCQs generated'); return; }
  qs.forEach((q,i) => {
    const opts = (q.options||[]).map(o => {
      const correct = o.trim().startsWith(q.answer + '.');
      return `<div class="q-opt ${correct?'correct':''}">${escHtml(o)}</div>`;
    }).join('');
    pane.innerHTML += `<div class="q-card">
      <div class="q-header"><span class="q-num">MCQ ${i+1}</span>${badge(q.likelihood)}</div>
      <div class="q-text">${escHtml(q.question)}</div>
      <div class="q-options">${opts}</div>
      <div class="q-section-label">Explanation</div>
      <div class="q-explanation">💡 ${escHtml(q.explanation||'')}</div>
    </div>`;
  });
}

function renderShort(qs) {
  const pane = document.getElementById('short-pane');
  pane.innerHTML = '';
  if (!qs.length) { pane.innerHTML = empty('No short answer questions'); return; }
  qs.forEach((q,i) => {
    pane.innerHTML += `<div class="q-card">
      <div class="q-header"><span class="q-num">Short ${i+1}</span>${badge(q.likelihood)}</div>
      <div class="q-text">${escHtml(q.question)}</div>
      <div class="q-section-label">Model Answer</div>
      <div class="q-answer">${escHtml(q.answer||'')}</div>
    </div>`;
  });
}

function renderEssay(qs) {
  const pane = document.getElementById('essay-pane');
  pane.innerHTML = '';
  if (!qs.length) { pane.innerHTML = empty('No essay questions'); return; }
  qs.forEach((q,i) => {
    const marks = (q.markingGuide||[]).map(m => `<li>${escHtml(m)}</li>`).join('');
    pane.innerHTML += `<div class="q-card">
      <div class="q-header"><span class="q-num">Essay ${i+1}</span>${badge(q.likelihood)}</div>
      <div class="q-text">${escHtml(q.question)}</div>
      <div class="q-section-label">Model Answer</div>
      <div class="q-answer">${escHtml(q.answer||'')}</div>
      <div class="q-section-label">Marking Guide</div>
      <ul class="q-marking-list">${marks}</ul>
    </div>`;
  });
}

function renderFill(qs) {
  const pane = document.getElementById('fill-pane');
  pane.innerHTML = '';
  if (!qs.length) { pane.innerHTML = empty('No fill-in-the-blank questions'); return; }
  qs.forEach((q,i) => {
    const qText = escHtml(q.question).replace('_____', '<span class="fill-blank-word">_____</span>');
    pane.innerHTML += `<div class="q-card">
      <div class="q-header"><span class="q-num">Fill ${i+1}</span></div>
      <div class="q-text">${qText}</div>
      ${q.context ? `<div class="q-answer" style="font-size:0.8rem;font-style:italic;margin-bottom:0.4rem">${escHtml(q.context)}</div>` : ''}
      <div class="fill-answer">✅ Answer: ${escHtml(q.blank||'')}</div>
    </div>`;
  });
}

function renderTopics(ts) {
  const pane = document.getElementById('topics-pane');
  pane.innerHTML = '<div class="topics-list"></div>';
  const list = pane.querySelector('.topics-list');
  if (!ts.length) { pane.innerHTML = empty('No topics generated'); return; }
  ts.forEach((t,i) => {
    list.innerHTML += `<div class="topic-card">
      <div class="topic-rank">${i+1}</div>
      <div class="topic-info">
        <div class="topic-name">${escHtml(t.topic)}</div>
        <div class="topic-reason">${escHtml(t.reason||'')}</div>
      </div>
      <div class="topic-priority">${escHtml(t.priority||'Key Topic')}</div>
    </div>`;
  });
}

function empty(msg) {
  return `<div style="color:var(--text3);font-size:0.85rem;padding:1rem">${msg}</div>`;
}

// ── DOWNLOAD ──
function handleDownload() {
  if (!generatedData) return;
  const title = document.getElementById('rv-title').textContent || 'Course';
  let out = `EXAMSPULSE — EXAM PREP PACK\n${'='.repeat(50)}\nCourse: ${title}\nDate: ${new Date().toLocaleDateString()}\n\n`;
  out += `MULTIPLE CHOICE QUESTIONS\n${'-'.repeat(30)}\n`;
  (generatedData.mcq||[]).forEach((q,i) => {
    out += `\nQ${i+1}. ${q.question}\n`;
    (q.options||[]).forEach(o => { out += `  ${o}\n`; });
    out += `Answer: ${q.answer}\nExplanation: ${q.explanation||''}\n`;
  });
  out += `\n\nSHORT ANSWER QUESTIONS\n${'-'.repeat(30)}\n`;
  (generatedData.short||[]).forEach((q,i) => { out += `\nQ${i+1}. ${q.question}\nAnswer: ${q.answer||''}\n`; });
  out += `\n\nESSAY QUESTIONS\n${'-'.repeat(30)}\n`;
  (generatedData.essay||[]).forEach((q,i) => {
    out += `\nQ${i+1}. ${q.question}\n\nModel Answer:\n${q.answer||''}\n\nMarking Guide:\n`;
    (q.markingGuide||[]).forEach((m,j) => { out += `  ${j+1}. ${m}\n`; });
  });
  out += `\n\nFILL IN THE BLANK\n${'-'.repeat(30)}\n`;
  (generatedData.fill||[]).forEach((q,i) => { out += `\nQ${i+1}. ${q.question}\nAnswer: ${q.blank||''}\n`; });
  out += `\n\nTOP 5 TOPICS TO REVISE\n${'-'.repeat(30)}\n`;
  (generatedData.topics||[]).forEach((t,i) => { out += `\n${i+1}. ${t.topic}\n   ${t.reason||''}\n`; });

  const blob = new Blob([out], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ExamsPulse_${title.replace(/\s+/g,'_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── GEMINI API ──
async function callGemini(apiKey, prompt) {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function buildPrompt(notes, course, format) {
  const typeInstructions = {
    mixed: 'Generate: 10 MCQs, 8 short answers, 4 essays, 5 fill-in-the-blank, 5 top topics.',
    mcq: 'Generate: 15 MCQs, 0 short answers, 0 essays, 5 fill-in-the-blank, 5 top topics.',
    essay: 'Generate: 0 MCQs, 0 short answers, 6 essays, 0 fill-in-the-blank, 5 top topics.',
    short: 'Generate: 0 MCQs, 12 short answers, 0 essays, 5 fill-in-the-blank, 5 top topics.'
  };
  return `You are ExamPrep AI. Analyze the course material for "${course}" and generate predicted exam questions.

${typeInstructions[format] || typeInstructions.mixed}

Return ONLY a valid JSON object with this exact structure:
{
  "mcq": [{ "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A", "explanation": "...", "likelihood": "high" }],
  "short": [{ "question": "...", "answer": "...", "likelihood": "high" }],
  "essay": [{ "question": "...", "answer": "...", "markingGuide": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"], "likelihood": "high" }],
  "fill": [{ "question": "The _____ is...", "blank": "key term", "context": "..." }],
  "topics": [{ "topic": "...", "reason": "...", "priority": "Must Know" }]
}

Rules: order by most likely first; likelihood = "high", "mid", or "low"; student-friendly language.
Return ONLY the JSON object, no markdown fences, no extra text.

COURSE MATERIAL:
${notes.substring(0, 12000)}`;
}

function parseJSON(text) {
  let clean = text.trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/,'').trim();
  try { return JSON.parse(clean); } catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('Could not parse AI response. Please try again.');
  }
}

// ── HELPERS ──
function labelForType(t) {
  return { mixed:'Mixed · MCQ + Essay + Short', mcq:'MCQ Only', essay:'Essay Only', short:'Short Answer Only' }[t] || 'Mixed';
}
function updateCharCount() {
  const notes = document.getElementById('cfg-notes');
  document.getElementById('cfg-char-count').textContent = (notes?.value.length||0).toLocaleString() + ' characters';
}
function toggleKeyVis() {
  const inp = document.getElementById('cfg-api-key');
  const btn = document.getElementById('key-vis-btn');
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}
function setConfigError(msg) {
  const el = document.getElementById('config-error');
  el.textContent = msg;
  el.classList.toggle('hidden', !msg);
}
function setError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.toggle('hidden', !msg);
}
function show(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hide(id) { document.getElementById(id)?.classList.add('hidden'); }
function val(id) { return document.getElementById(id)?.value || ''; }
function saveJSON(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function loadJSON(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── FILE UPLOAD ──
function triggerFileUpload() {
  document.getElementById('file-input')?.click();
}

async function handleFileSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  setHomeError('');
  const ext = file.name.split('.').pop().toLowerCase();
  const chipRow = document.getElementById('file-chip-row');
  const chipName = document.getElementById('file-chip-name');

  chipName.textContent = file.name;
  chipRow.classList.remove('hidden');

  const textarea = document.getElementById('home-notes');

  try {
    let text = '';

    if (ext === 'txt' || ext === 'md') {
      text = await readAsText(file);
    } else if (ext === 'pdf') {
      text = await extractPdfText(file);
    } else if (ext === 'pptx' || ext === 'docx') {
      setHomeError('PPTX/DOCX parsing requires a backend. For now, please copy-paste the text from your slides or document into the box.');
      event.target.value = '';
      chipRow.classList.add('hidden');
      return;
    } else {
      text = await readAsText(file);
    }

    if (!text || text.trim().length < 10) {
      setHomeError('Could not extract text from this file. Try copying the content and pasting it manually.');
      chipRow.classList.add('hidden');
      event.target.value = '';
      return;
    }

    textarea.value = text;
    updateHomeCharCount();
    // Auto-open settings to remind user to set course + key
    const panel = document.getElementById('settings-panel');
    if (panel?.classList.contains('hidden')) toggleSettingsPanel();
  } catch (err) {
    setHomeError('File read error: ' + (err.message || 'Unknown error'));
    chipRow.classList.add('hidden');
  }

  // Reset file input so same file can be re-selected
  event.target.value = '';
}

function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

async function extractPdfText(file) {
  if (typeof pdfjsLib === 'undefined') throw new Error('PDF library not loaded');
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText.trim();
}

function removeFile() {
  document.getElementById('file-chip-row')?.classList.add('hidden');
  const notes = document.getElementById('home-notes');
  if (notes) notes.value = '';
  updateHomeCharCount();
  setHomeError('');
}

// ── SETTINGS PANEL TOGGLE ──
function toggleSettingsPanel() {
  const panel = document.getElementById('settings-panel');
  const btn   = document.getElementById('card-settings-btn');
  if (!panel) return;
  const isHidden = panel.classList.toggle('hidden');
  btn?.classList.toggle('active', !isHidden);
  // Auto-focus course name when opening
  if (!isHidden) document.getElementById('home-course')?.focus();
}

