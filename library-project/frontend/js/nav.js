/* =====================================================
   nav.js — Navigation, Sidebar & Page Routing
   Library Management System
   ===================================================== */

let currentPage = 'dashboard';
let searchTerm  = '';
let filterStatus = 'all';
let filterTab    = 'all';

// ─── BUILD SIDEBAR NAV ────────────────────────────────────────────────────
function buildNav() {
  document.getElementById('role-badge-logo').outerHTML =
    `<span id="role-badge-logo" class="role-badge ${currentUser.role}">${currentUser.role}</span>`;

  const av = document.getElementById('sidebar-avatar');
  av.textContent = initials(currentUser.name);
  if (isAdmin()) av.classList.add('admin-av'); else av.classList.remove('admin-av');
  document.getElementById('sidebar-uname').textContent = currentUser.name;
  document.getElementById('sidebar-urole').textContent = isAdmin()
    ? 'Administrator'
    : `Student · ${currentUser.studentId || ''}`;

  const nav = document.getElementById('nav-links');
  if (isAdmin()) {
    nav.innerHTML = `
      <div class="nav-section">Overview</div>
      <button class="nav-btn active" onclick="nav('dashboard')"><span class="nav-icon">◉</span> Dashboard</button>
      <div class="nav-section">Library</div>
      <button class="nav-btn" onclick="nav('books')"><span class="nav-icon">📖</span> Books</button>
      <button class="nav-btn" onclick="nav('members')"><span class="nav-icon">👥</span> Members</button>
      <button class="nav-btn" onclick="nav('loans')"><span class="nav-icon">↕</span> Loans</button>
      <div class="nav-section">Manage</div>
      <button class="nav-btn" id="nav-requests" onclick="nav('requests')"><span class="nav-icon">📥</span> Book Requests</button>
      <button class="nav-btn" id="nav-signups" onclick="nav('signups')"><span class="nav-icon">🆕</span> New Signups</button>
      <button class="nav-btn" onclick="nav('announcements')"><span class="nav-icon">📢</span> Announcements</button>
      <button class="nav-btn" onclick="nav('reports')"><span class="nav-icon">📊</span> Reports</button>
    `;
  } else {
    nav.innerHTML = `
      <div class="nav-section">My Library</div>
      <button class="nav-btn active" onclick="nav('dashboard')"><span class="nav-icon">◉</span> My Dashboard</button>
      <button class="nav-btn" onclick="nav('my-loans')"><span class="nav-icon">📚</span> My Loans</button>
      <button class="nav-btn" onclick="nav('my-requests')"><span class="nav-icon">📥</span> My Requests</button>
      <div class="nav-section">Browse</div>
      <button class="nav-btn" onclick="nav('catalog')"><span class="nav-icon">🔍</span> Book Catalog</button>
      <button class="nav-btn" onclick="nav('announcements')"><span class="nav-icon">📢</span> Announcements</button>
      <button class="nav-btn" onclick="nav('profile')"><span class="nav-icon">👤</span> My Profile</button>
    `;
  }
}

// ─── NAVIGATE TO PAGE ─────────────────────────────────────────────────────
async function nav(page) {
  currentPage  = page;
  searchTerm   = '';
  filterStatus = 'all';
  filterTab    = 'all';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const target = document.querySelector(`.nav-btn[onclick="nav('${page}')"]`);
  if (target) target.classList.add('active');
  await render();
}

// ─── RENDER DISPATCHER ────────────────────────────────────────────────────
async function render() {
  await updateSidebarStats();
  const main = document.getElementById('main');

  if (isAdmin()) {
    if      (currentPage === 'dashboard')     main.innerHTML = await adminDashboard();
    else if (currentPage === 'books')         main.innerHTML = await adminBooks();
    else if (currentPage === 'members')       main.innerHTML = await adminMembers();
    else if (currentPage === 'loans')         main.innerHTML = await adminLoans();
    else if (currentPage === 'requests')      main.innerHTML = await adminRequests();
    else if (currentPage === 'signups')       main.innerHTML = await adminSignups();
    else if (currentPage === 'announcements') main.innerHTML = await adminAnnouncements();
    else if (currentPage === 'reports')       main.innerHTML = await adminReports();
  } else {
    if      (currentPage === 'dashboard')     main.innerHTML = await studentDashboard();
    else if (currentPage === 'my-loans')      main.innerHTML = await studentLoans();
    else if (currentPage === 'my-requests')   main.innerHTML = await studentRequests();
    else if (currentPage === 'catalog')       main.innerHTML = await studentCatalog();
    else if (currentPage === 'announcements') main.innerHTML = await sharedAnnouncements();
    else if (currentPage === 'profile')       main.innerHTML = await studentProfile();
  }
  await updateRequestBadge();
  await updateSignupBadge();
}

// ─── SIDEBAR STATS ────────────────────────────────────────────────────────
async function updateSidebarStats() {
  const [books, users, loans] = await Promise.all([
    dbGetAll('books'), dbGetAll('users'), dbGetAll('loans')
  ]);
  const activeLoans = loans.filter(l => !l.returned);
  const overdue     = activeLoans.filter(l => calcLateFee(l.dueDate) > 0);
  const statsEl     = document.getElementById('sidebar-stats');

  if (isAdmin()) {
    statsEl.innerHTML = `
      <div class="stat-pill"><span>Books</span><b>${books.length}</b></div>
      <div class="stat-pill"><span>Members</span><b>${users.filter(u => u.role === 'student').length}</b></div>
      <div class="stat-pill"><span>Active loans</span><b>${activeLoans.length}</b></div>
      <div class="stat-pill"><span>Overdue</span><b style="color:var(--red-dark)">${overdue.length}</b></div>
    `;
  } else {
    const myLoans = activeLoans.filter(l => l.userId === currentUser.id);
    const myFees  = myLoans.reduce((s, l) => s + calcLateFee(l.dueDate), 0);
    statsEl.innerHTML = `
      <div class="stat-pill"><span>My active loans</span><b>${myLoans.length}</b></div>
      <div class="stat-pill"><span>My fees</span><b style="color:${myFees > 0 ? 'var(--red-dark)' : 'inherit'}">${myFees > 0 ? '৳' + myFees.toFixed(2) : 'None'}</b></div>
    `;
  }
}

// ─── NOTIFICATION BADGES ──────────────────────────────────────────────────
async function updateRequestBadge() {
  if (!isAdmin()) return;
  const requests = await dbGetAll('requests');
  const pending  = requests.filter(r => r.status === 'pending').length;
  const navBtn   = document.getElementById('nav-requests');
  if (!navBtn) return;
  const existing = navBtn.querySelector('.nav-badge');
  if (existing) existing.remove();
  if (pending > 0) navBtn.innerHTML += `<span class="nav-badge">${pending}</span>`;
}

async function updateSignupBadge() {
  if (!isAdmin()) return;
  const users   = await dbGetAll('users');
  const pending = users.filter(u => u.role === 'student' && !u.approved).length;
  const navBtn  = document.getElementById('nav-signups');
  if (!navBtn) return;
  const existing = navBtn.querySelector('.nav-badge');
  if (existing) existing.remove();
  if (pending > 0) navBtn.innerHTML += `<span class="nav-badge">${pending}</span>`;
}
