/* =====================================================
   auth.js — Authentication & Signup Logic
   Library Management System
   ===================================================== */

// ─── AUTH STATE ────────────────────────────────────────────────────────────
let currentUser = null;
function isAdmin()   { return currentUser?.role === 'admin'; }
function isStudent() { return currentUser?.role === 'student'; }

// ─── LOGIN TAB TOGGLE ─────────────────────────────────────────────────────
let loginRole = 'admin';

function switchLoginTab(role) {
  loginRole = role;
  document.querySelectorAll('.login-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && role === 'admin') || (i === 1 && role === 'student'));
  });
  const hint       = document.getElementById('login-hint');
  const divider    = document.getElementById('signup-divider');
  const cta        = document.getElementById('signup-cta');
  const footerNote = document.getElementById('login-footer-note');

  if (role === 'admin') {
    hint.innerHTML = '<b>Admin demo:</b> Username: <b>admin</b> · Password: <b>admin123</b>';
    divider.style.display    = 'none';
    cta.style.display        = 'none';
    footerNote.style.display = 'block';
  } else {
    hint.innerHTML = '<b>Student demo:</b> Student ID: <b>STU001</b>, <b>STU002</b>, or <b>STU003</b><br>Password = Student ID';
    divider.style.display    = 'flex';
    cta.style.display        = 'block';
    footerNote.style.display = 'none';
  }
  document.getElementById('login-error').style.display = 'none';
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────
async function doLogin() {
  const username = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value.trim();
  const errEl    = document.getElementById('login-error');
  errEl.style.display = 'none';

  if (!username || !password) {
    errEl.textContent = 'Please enter username and password.';
    errEl.style.display = 'block'; return;
  }

  const user = await dbGetByIndex('users', 'username', username);
  if (!user || user.password !== password) {
    errEl.textContent = 'Invalid username or password.';
    errEl.style.display = 'block'; return;
  }
  if (user.role !== loginRole) {
    errEl.textContent = `This account is not a ${loginRole} account.`;
    errEl.style.display = 'block'; return;
  }
  if (user.role === 'student' && !user.approved) {
    errEl.textContent = 'Your account is pending admin approval. Please wait for confirmation.';
    errEl.style.display = 'block'; return;
  }

  currentUser = user;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').classList.remove('app-hidden');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';

  buildNav();
  await render();
}

// ─── LOGOUT ────────────────────────────────────────────────────────────────
function doLogout() {
  currentUser  = null;
  currentPage  = 'dashboard';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').classList.add('app-hidden');
}

// ─── SIGNUP ────────────────────────────────────────────────────────────────
let signupStep = 1;
const signupData = {};

function showSignup() {
  signupStep = 1;
  Object.keys(signupData).forEach(k => delete signupData[k]);
  ['s-fname','s-lname','s-email','s-phone','s-sid','s-year','s-dept','s-pass','s-cpass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const termsEl = document.getElementById('s-terms');
  if (termsEl) termsEl.checked = false;
  document.getElementById('signup-error').style.display   = 'none';
  document.getElementById('signup-success').style.display = 'none';
  document.getElementById('signup-step-1').style.display  = 'block';
  document.getElementById('signup-step-2').style.display  = 'none';
  document.getElementById('signup-step-3').style.display  = 'none';
  updateSignupStepIndicator(1);
  document.getElementById('login-screen').style.display   = 'none';
  document.getElementById('signup-screen').classList.add('open');
}

function hideSignup() {
  document.getElementById('signup-screen').classList.remove('open');
  document.getElementById('login-screen').style.display = 'flex';
  switchLoginTab('student');
}

function updateSignupStepIndicator(step) {
  for (let i = 1; i <= 3; i++) {
    const stepEl = document.getElementById('sstep-' + i);
    const dot    = stepEl.querySelector('.step-dot');
    stepEl.classList.remove('active', 'done');
    if (i < step)       { stepEl.classList.add('done');   dot.textContent = '✓'; }
    else if (i === step){ stepEl.classList.add('active'); dot.textContent = i;   }
    else                { dot.textContent = i; }
  }
  for (let i = 1; i <= 2; i++) {
    document.getElementById('sline-' + i).classList.toggle('done', i < step);
  }
}

function signupShowError(msg) {
  const el = document.getElementById('signup-error');
  el.textContent = msg;
  el.style.display = 'block';
}
function signupClearError() {
  document.getElementById('signup-error').style.display = 'none';
}

function signupNext(fromStep) {
  signupClearError();
  if (fromStep === 1) {
    const fname = document.getElementById('s-fname').value.trim();
    const lname = document.getElementById('s-lname').value.trim();
    const email = document.getElementById('s-email').value.trim();
    if (!fname || !lname)             return signupShowError('Please enter your first and last name.');
    if (!email || !email.includes('@')) return signupShowError('Please enter a valid email address.');
    signupData.fname = fname; signupData.lname = lname;
    signupData.email = email;
    signupData.phone = document.getElementById('s-phone').value.trim();
    document.getElementById('signup-step-1').style.display = 'none';
    document.getElementById('signup-step-2').style.display = 'block';
    signupStep = 2; updateSignupStepIndicator(2);
  } else if (fromStep === 2) {
    const sid  = document.getElementById('s-sid').value.trim().toUpperCase();
    const year = document.getElementById('s-year').value;
    const dept = document.getElementById('s-dept').value;
    if (!sid)  return signupShowError('Please enter your Student ID.');
    if (!year) return signupShowError('Please select your year of study.');
    if (!dept) return signupShowError('Please select your department.');
    signupData.sid  = sid;
    signupData.year = parseInt(year);
    signupData.dept = dept;
    document.getElementById('signup-step-2').style.display = 'none';
    document.getElementById('signup-step-3').style.display = 'block';
    signupStep = 3; updateSignupStepIndicator(3);
  }
}

function signupBack(fromStep) {
  signupClearError();
  if (fromStep === 2) {
    document.getElementById('signup-step-2').style.display = 'none';
    document.getElementById('signup-step-1').style.display = 'block';
    signupStep = 1; updateSignupStepIndicator(1);
  } else if (fromStep === 3) {
    document.getElementById('signup-step-3').style.display = 'none';
    document.getElementById('signup-step-2').style.display = 'block';
    signupStep = 2; updateSignupStepIndicator(2);
  }
}

async function doSignup() {
  signupClearError();
  const pass  = document.getElementById('s-pass').value;
  const cpass = document.getElementById('s-cpass').value;
  const terms = document.getElementById('s-terms').checked;

  if (pass.length < 4)  return signupShowError('Password must be at least 4 characters.');
  if (pass !== cpass)   return signupShowError('Passwords do not match.');
  if (!terms)           return signupShowError('Please accept the terms and conditions.');

  const existing = await dbGetByIndex('users', 'username', signupData.sid);
  if (existing) return signupShowError('This Student ID is already registered. Please use a different ID or contact admin.');

  const allUsers = await dbGetAll('users');
  if (allUsers.some(u => u.email === signupData.email))
    return signupShowError('This email address is already registered.');

  const newUser = {
    username: signupData.sid,
    password: pass,
    role: 'student',
    name: signupData.fname + ' ' + signupData.lname,
    email: signupData.email,
    phone: signupData.phone || '',
    studentId: signupData.sid,
    department: signupData.dept,
    year: signupData.year,
    joined: new Date().toISOString(),
    approved: false,
    selfRegistered: true,
  };

  await dbAdd('users', newUser);

  document.getElementById('signup-step-3').style.display  = 'none';
  document.getElementById('signup-steps').style.display   = 'none';
  document.getElementById('signup-success').style.display = 'block';
}
