/* =====================================================
   student.js — Student Page Rendering Functions
   Library Management System
   Pages: Dashboard, My Loans, My Requests,
          Book Catalog, Announcements, My Profile
   ===================================================== */

// ─── STUDENT DASHBOARD ────────────────────────────────────────────────────
async function studentDashboard() {
  const [books, loans, requests, announcements] = await Promise.all([
    dbGetAll('books'), dbGetAll('loans'), dbGetAll('requests'), dbGetAll('announcements')
  ]);
  const myLoans    = loans.filter(l => l.userId === currentUser.id && !l.returned);
  const myOverdue  = myLoans.filter(l => calcLateFee(l.dueDate) > 0);
  const myFees     = myOverdue.reduce((s, l) => s + calcLateFee(l.dueDate), 0);
  const myHistory  = loans.filter(l => l.userId === currentUser.id && l.returned).length;
  const myPending  = requests.filter(r => r.userId === currentUser.id && r.status === 'pending').length;
  const pinned     = announcements.filter(a => a.pinned).slice(0, 2);

  const loanRows = myLoans.map(loan => {
    const book   = books.find(b => b.id === loan.bookId);
    const fee    = calcLateFee(loan.dueDate);
    const days   = daysUntilDue(loan.dueDate);
    const status = getLoanStatus(loan);
    const badge  = status === 'overdue'  ? `<span class="badge overdue">Overdue ${Math.abs(days)}d</span>`
                 : status === 'due-soon' ? `<span class="badge due-soon">Due in ${days}d</span>`
                 :                         `<span class="badge checked">Active</span>`;
    return `<tr>
      <td><strong>${escHtml(book?.title || '—')}</strong></td>
      <td>${escHtml(book?.author || '—')}</td>
      <td>${formatDate(loan.dueDate)}</td>
      <td>${badge}</td>
      <td>${fee > 0 ? `<span style="color:var(--red-dark);font-weight:500">৳${fee.toFixed(2)}</span>` : '—'}</td>
    </tr>`;
  }).join('');

  const annCards = pinned.map(ann => `
    <div style="background:var(--bg-primary);border:0.5px solid var(--border-light);border-left:3px solid var(--green);border-radius:var(--radius-lg);padding:1rem 1.25rem">
      <div style="font-weight:500">${escHtml(ann.title)}</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">${escHtml(ann.body)}</div>
    </div>`).join('');

  return `
  <div class="topbar"><h1>Welcome, ${escHtml(currentUser.name.split(' ')[0])} 👋</h1></div>
  <div class="metrics">
    <div class="metric"><div class="num">${myLoans.length}</div><div class="lbl">Active loans</div></div>
    <div class="metric"><div class="num">${myHistory}</div><div class="lbl">Books returned</div></div>
    <div class="metric"><div class="num">${myPending}</div><div class="lbl">Pending requests</div></div>
    <div class="metric"><div class="num" style="color:${myFees > 0 ? 'var(--red-dark)' : 'inherit'}">৳${myFees.toFixed(2)}</div><div class="lbl">Outstanding fees</div></div>
  </div>
  ${myFees > 0 ? `<div class="alert danger">⚠ You have ৳${myFees.toFixed(2)} in outstanding late fees. Please pay at the library desk.</div>` : ''}
  ${myOverdue.some(l => daysUntilDue(l.dueDate) <= -3) ? `<div class="alert warn">⏰ You have books overdue. Please return them as soon as possible to avoid increasing fees.</div>` : ''}
  ${pinned.length ? `<div class="section-title">Pinned announcements</div><div style="display:flex;flex-direction:column;gap:8px;margin-bottom:1.5rem">${annCards}</div>` : ''}
  <div class="section-title">My current loans</div>
  ${myLoans.length
    ? `<div class="table-wrap"><table><thead><tr><th>Book</th><th>Author</th><th>Due date</th><th>Status</th><th>Fee</th></tr></thead><tbody>${loanRows}</tbody></table></div>`
    : '<div class="empty">No active loans · <a href="#" onclick="nav(\'catalog\');return false" style="color:var(--green)">Browse the catalog</a></div>'}`;
}

// ─── STUDENT: MY LOANS ────────────────────────────────────────────────────
async function studentLoans() {
  const [books, loans] = await Promise.all([dbGetAll('books'), dbGetAll('loans')]);
  let myLoans = loans.filter(l => l.userId === currentUser.id);
  if      (filterTab === 'active')   myLoans = myLoans.filter(l => !l.returned);
  else if (filterTab === 'returned') myLoans = myLoans.filter(l => l.returned);
  myLoans.sort((a, b) => new Date(b.checkedOut) - new Date(a.checkedOut));

  const all = loans.filter(l => l.userId === currentUser.id);
  const counts = {
    all:      all.length,
    active:   all.filter(l => !l.returned).length,
    returned: all.filter(l => l.returned).length,
  };

  const rows = myLoans.map(loan => {
    const book   = books.find(b => b.id === loan.bookId);
    const fee    = calcLateFee(loan.dueDate);
    const days   = daysUntilDue(loan.dueDate);
    const status = getLoanStatus(loan);
    const badge  = status === 'returned' ? `<span class="badge available">Returned</span>`
                 : status === 'overdue'  ? `<span class="badge overdue">Overdue ${Math.abs(days)}d</span>`
                 : status === 'due-soon' ? `<span class="badge due-soon">Due in ${days}d</span>`
                 :                         `<span class="badge checked">Active</span>`;
    return `<tr>
      <td><strong>${escHtml(book?.title || '—')}</strong></td>
      <td>${escHtml(book?.author || '—')}</td>
      <td>${escHtml(book?.genre || '—')}</td>
      <td>${formatDate(loan.checkedOut)}</td>
      <td>${formatDate(loan.dueDate)}</td>
      <td>${badge}</td>
      <td>${fee > 0 ? `<span style="color:var(--red-dark);font-weight:500">৳${fee.toFixed(2)}</span>` : '—'}</td>
      <td>${loan.feePaid ? `<span style="color:var(--green-dark);font-size:12px">Paid</span>` : loan.returned && fee === 0 ? '—' : fee > 0 ? 'Unpaid' : '—'}</td>
    </tr>`;
  }).join('');

  return `
  <div class="topbar"><h1>My Loans</h1></div>
  <div class="tab-row">
    <button class="tab ${filterTab === 'all'      ? 'active' : ''}" onclick="filterTab='all';render()">All (${counts.all})</button>
    <button class="tab ${filterTab === 'active'   ? 'active' : ''}" onclick="filterTab='active';render()">Active (${counts.active})</button>
    <button class="tab ${filterTab === 'returned' ? 'active' : ''}" onclick="filterTab='returned';render()">Returned (${counts.returned})</button>
  </div>
  <div class="alert blue">ℹ Late fee: ৳0.50 per day after the due date. Fees are paid at the library desk.</div>
  <div class="table-wrap"><table>
    <thead><tr><th>Book</th><th>Author</th><th>Genre</th><th>Checked out</th><th>Due date</th><th>Status</th><th>Fee</th><th>Fee status</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="8" class="empty">No loan history</td></tr>'}</tbody>
  </table></div>`;
}

// ─── STUDENT: MY REQUESTS ─────────────────────────────────────────────────
async function studentRequests() {
  const [books, requests] = await Promise.all([dbGetAll('books'), dbGetAll('requests')]);
  const myRequests = requests
    .filter(r => r.userId === currentUser.id)
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

  const rows = myRequests.map(req => {
    const book = books.find(b => b.id === req.bookId);
    return `<tr>
      <td><strong>${escHtml(book?.title || '—')}</strong></td>
      <td>${escHtml(book?.author || '—')}</td>
      <td>${formatDate(req.requestedAt)}</td>
      <td>${escHtml(req.note || '—')}</td>
      <td><span class="badge ${req.status}">${req.status}</span></td>
      <td>${req.adminNote ? escHtml(req.adminNote) : '—'}</td>
      <td>${req.status === 'pending' ? `<button class="btn sm" onclick="cancelRequest(${req.id})">Cancel</button>` : ''}</td>
    </tr>`;
  }).join('');

  return `
  <div class="topbar"><h1>My Book Requests</h1><button class="btn primary" onclick="openRequestBook()">+ Request a book</button></div>
  <div class="alert blue">ℹ Submit a request and an admin will review it. Approved requests will be processed as a loan at the library desk.</div>
  <div class="table-wrap"><table>
    <thead><tr><th>Book</th><th>Author</th><th>Requested</th><th>Your note</th><th>Status</th><th>Admin reply</th><th>Actions</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7" class="empty">No requests yet</td></tr>'}</tbody>
  </table></div>`;
}

// ─── STUDENT: CATALOG ─────────────────────────────────────────────────────
async function studentCatalog() {
  const [books, loans, requests] = await Promise.all([dbGetAll('books'), dbGetAll('loans'), dbGetAll('requests')]);
  let filtered = [...books];
  if (searchTerm)             filtered = filtered.filter(b => b.title.toLowerCase().includes(searchTerm) || b.author.toLowerCase().includes(searchTerm) || (b.genre || '').toLowerCase().includes(searchTerm));
  if (filterStatus === 'available') filtered = filtered.filter(b => b.available > 0);

  const myActiveLoans = loans.filter(l => l.userId === currentUser.id && !l.returned);
  const myRequested   = requests.filter(r => r.userId === currentUser.id && r.status === 'pending').map(r => r.bookId);

  const cards = filtered.map(book => {
    const alreadyLoaned    = myActiveLoans.some(l => l.bookId === book.id);
    const alreadyRequested = myRequested.includes(book.id);
    const statusLabel      = book.available > 0 ? (book.available < book.copies ? `${book.available}/${book.copies} avail` : 'Available') : 'Unavailable';
    const badgeCls         = book.available > 0 ? 'available' : 'checked';
    return `<div class="book-card ${book.available > 0 ? 'available' : ''}">
      <div class="card-title">${escHtml(book.title)}</div>
      <div class="card-author">${escHtml(book.author)}${book.year ? ' · ' + book.year : ''}</div>
      <div class="card-meta">
        <span class="badge ${badgeCls}">${statusLabel}</span>
        ${book.genre ? `<span class="badge genre">${escHtml(book.genre)}</span>` : ''}
      </div>
      ${book.description ? `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;line-height:1.4">${escHtml(book.description)}</div>` : ''}
      <div class="card-footer">
        ${alreadyLoaned
          ? `<span style="font-size:12px;color:var(--green-dark);font-weight:500">✓ You have this book</span>`
          : alreadyRequested
          ? `<span style="font-size:12px;color:var(--amber-dark)">⏳ Request pending</span>`
          : `<button class="btn sm primary" onclick="openRequestBook(${book.id})">Request book</button>`}
      </div>
    </div>`;
  }).join('');

  return `
  <div class="topbar">
    <h1>Book Catalog</h1>
    <div class="search-wrap"><span class="search-icon">⌕</span><input type="text" placeholder="Search title, author, genre…" value="${escHtml(searchTerm)}" oninput="searchTerm=this.value.toLowerCase();render()"></div>
  </div>
  <div class="filter-row">
    <span class="filter-chip ${filterStatus === 'all'       ? 'on' : ''}" onclick="filterStatus='all';render()">All (${books.length})</span>
    <span class="filter-chip ${filterStatus === 'available' ? 'on' : ''}" onclick="filterStatus='available';render()">Available only</span>
  </div>
  ${filtered.length ? `<div class="cards-grid">${cards}</div>` : '<div class="empty">No books found</div>'}`;
}

// ─── SHARED: ANNOUNCEMENTS ────────────────────────────────────────────────
async function sharedAnnouncements() {
  const announcements = await dbGetAll('announcements');
  announcements.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.createdAt) - new Date(a.createdAt));

  const cards = announcements.map(ann => `
    <div style="background:var(--bg-primary);border:0.5px solid var(--border-light);${ann.pinned ? 'border-left:3px solid var(--green);' : ''}border-radius:var(--radius-lg);padding:1.25rem">
      <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px">
        <div style="flex:1">
          <div style="font-weight:500;font-size:15px">${escHtml(ann.title)}</div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px">${formatDateTime(ann.createdAt)} · Posted by library</div>
        </div>
        ${ann.pinned ? `<span class="badge available">Pinned</span>` : ''}
      </div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.6">${escHtml(ann.body)}</div>
    </div>`).join('');

  return `
  <div class="topbar"><h1>Announcements</h1></div>
  ${announcements.length ? `<div style="display:flex;flex-direction:column;gap:1rem">${cards}</div>` : '<div class="empty">No announcements</div>'}`;
}

// ─── STUDENT: PROFILE ─────────────────────────────────────────────────────
async function studentProfile() {
  const u = currentUser;
  const [loans, requests] = await Promise.all([dbGetAll('loans'), dbGetAll('requests')]);
  const myLoans    = loans.filter(l => l.userId === u.id);
  const myFees     = myLoans.filter(l => !l.returned).reduce((s, l) => s + calcLateFee(l.dueDate), 0);
  const myRequests = requests.filter(r => r.userId === u.id);

  return `
  <div class="topbar"><h1>My Profile</h1><button class="btn primary" onclick="openEditProfile()">Edit profile</button></div>
  <div class="profile-card">
    <div class="avatar lg" style="background:var(--blue-light);color:var(--blue-dark)">${initials(u.name)}</div>
    <div class="profile-info">
      <h2>${escHtml(u.name)}</h2>
      <p>${escHtml(u.email)}</p>
      <div class="badges">
        <span class="badge admin-badge">${escHtml(u.studentId || '—')}</span>
        ${u.department ? `<span class="badge genre">${escHtml(u.department)}</span>` : ''}
        ${u.year ? `<span class="badge genre">Year ${u.year}</span>` : ''}
      </div>
    </div>
  </div>
  <div class="metrics">
    <div class="metric"><div class="num">${myLoans.filter(l => !l.returned).length}</div><div class="lbl">Active loans</div></div>
    <div class="metric"><div class="num">${myLoans.filter(l => l.returned).length}</div><div class="lbl">Books returned</div></div>
    <div class="metric"><div class="num">${myRequests.length}</div><div class="lbl">Total requests</div></div>
    <div class="metric"><div class="num" style="color:${myFees > 0 ? 'var(--red-dark)' : 'inherit'}">৳${myFees.toFixed(2)}</div><div class="lbl">Outstanding fees</div></div>
  </div>
  <div class="section-title">Account details</div>
  <div style="background:var(--bg-primary);border:0.5px solid var(--border-light);border-radius:var(--radius-lg);padding:1.25rem">
    <table style="width:100%;font-size:13px">
      <tr><td style="color:var(--text-secondary);padding:6px 0;width:160px">Full name</td><td>${escHtml(u.name)}</td></tr>
      <tr><td style="color:var(--text-secondary);padding:6px 0">Student ID</td><td>${escHtml(u.studentId || '—')}</td></tr>
      <tr><td style="color:var(--text-secondary);padding:6px 0">Email</td><td>${escHtml(u.email)}</td></tr>
      <tr><td style="color:var(--text-secondary);padding:6px 0">Phone</td><td>${escHtml(u.phone || '—')}</td></tr>
      <tr><td style="color:var(--text-secondary);padding:6px 0">Department</td><td>${escHtml(u.department || '—')}</td></tr>
      <tr><td style="color:var(--text-secondary);padding:6px 0">Year</td><td>${u.year ? 'Year ' + u.year : '—'}</td></tr>
      <tr><td style="color:var(--text-secondary);padding:6px 0">Member since</td><td>${formatDate(u.joined)}</td></tr>
    </table>
  </div>
  <div style="margin-top:1rem"><button class="btn danger sm" onclick="openChangePassword()">Change password</button></div>`;
}
