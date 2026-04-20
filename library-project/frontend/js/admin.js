/* =====================================================
   admin.js — Admin Page Rendering Functions
   Library Management System
   Pages: Dashboard, Books, Members, Loans, Requests,
          Signups, Announcements, Reports
   ===================================================== */

const GENRES = ['Fiction','Sci-Fi','Non-Fiction','Self-Help','Classic','Memoir','History','Biography','Mystery','Fantasy','Romance','Academic','Other'];
const DEPTS  = ['Computer Science','Physics','Mathematics','Chemistry','Biology','Engineering','Economics','Literature','History','Psychology','Other'];

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────
async function adminDashboard() {
  const [books, users, loans, requests] = await Promise.all([
    dbGetAll('books'), dbGetAll('users'), dbGetAll('loans'), dbGetAll('requests')
  ]);
  const students       = users.filter(u => u.role === 'student');
  const pendingSignups = students.filter(u => !u.approved);
  const activeLoans    = loans.filter(l => !l.returned);
  const overdueLoans   = activeLoans.filter(l => calcLateFee(l.dueDate) > 0);
  const totalFees      = overdueLoans.reduce((s, l) => s + calcLateFee(l.dueDate), 0);
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const totalCopies    = books.reduce((a, b) => a + b.copies, 0);

  const overdueRows = overdueLoans.slice(0, 6).map(loan => {
    const book    = books.find(b => b.id === loan.bookId);
    const user    = users.find(u => u.id === loan.userId);
    const fee     = calcLateFee(loan.dueDate);
    const daysOver = Math.abs(daysUntilDue(loan.dueDate));
    return `<tr>
      <td><strong>${escHtml(book?.title || '—')}</strong></td>
      <td>${escHtml(user?.name || '—')}</td>
      <td>${formatDate(loan.dueDate)}</td>
      <td><span style="color:var(--red-dark);font-weight:500">${daysOver}d overdue</span></td>
      <td><span style="color:var(--red-dark);font-weight:500">৳${fee.toFixed(2)}</span></td>
      <td>
        <button class="btn sm primary" onclick="returnBook(${loan.id})">Return</button>
        <button class="btn sm danger"  onclick="payFee(${loan.id},${fee})">Pay fee</button>
      </td>
    </tr>`;
  }).join('');

  const pendingRows = pendingRequests.slice(0, 5).map(req => {
    const book = books.find(b => b.id === req.bookId);
    const user = users.find(u => u.id === req.userId);
    return `<tr>
      <td>${escHtml(book?.title || '—')}</td>
      <td>${escHtml(user?.name || '—')}</td>
      <td>${formatDate(req.requestedAt)}</td>
      <td>${escHtml(req.note || '—')}</td>
      <td>
        <button class="btn sm primary" onclick="approveRequest(${req.id})">Approve</button>
        <button class="btn sm danger"  onclick="rejectRequest(${req.id})">Reject</button>
      </td>
    </tr>`;
  }).join('');

  const signupRows = pendingSignups.slice(0, 5).map(u => `<tr>
    <td><strong>${escHtml(u.name)}</strong></td>
    <td>${escHtml(u.studentId || '—')}</td>
    <td>${escHtml(u.department || '—')}</td>
    <td>${formatDate(u.joined)}</td>
    <td>
      <button class="btn sm primary" onclick="approveMember(${u.id})">Approve</button>
      <button class="btn sm danger"  onclick="deleteMember(${u.id})">Reject</button>
    </td>
  </tr>`).join('');

  return `
  <div class="topbar"><h1>Admin Dashboard</h1></div>
  <div class="metrics">
    <div class="metric"><div class="num">${totalCopies}</div><div class="lbl">Total copies</div></div>
    <div class="metric"><div class="num">${students.filter(u => u.approved).length}</div><div class="lbl">Active members</div></div>
    <div class="metric"><div class="num" style="color:var(--red-dark)">${overdueLoans.length}</div><div class="lbl">Overdue loans</div></div>
    <div class="metric"><div class="num" style="color:var(--red-dark)">৳${totalFees.toFixed(2)}</div><div class="lbl">Outstanding fees</div></div>
  </div>
  ${pendingSignups.length ? `<div class="alert warn">🆕 ${pendingSignups.length} new student registration${pendingSignups.length > 1 ? 's' : ''} awaiting approval. <a href="#" onclick="nav('signups');return false" style="color:var(--amber-dark);font-weight:500">Review now →</a></div>` : ''}
  ${overdueLoans.length  ? `<div class="alert danger">⚠ ${overdueLoans.length} overdue loan${overdueLoans.length > 1 ? 's' : ''} · Total fees: <strong>৳${totalFees.toFixed(2)}</strong></div>` : ''}
  ${pendingRequests.length ? `<div class="alert warn" style="margin-top:-0.5rem">📥 ${pendingRequests.length} pending book request${pendingRequests.length > 1 ? 's' : ''} awaiting approval.</div>` : ''}
  ${pendingSignups.length ? `
    <div class="section-title">Pending student registrations</div>
    <div class="table-wrap"><table><thead><tr><th>Name</th><th>Student ID</th><th>Department</th><th>Registered</th><th>Actions</th></tr></thead><tbody>${signupRows}</tbody></table></div>` : ''}
  <div class="section-title">Overdue loans</div>
  ${overdueLoans.length ? `<div class="table-wrap"><table><thead><tr><th>Book</th><th>Member</th><th>Due date</th><th>Status</th><th>Fee</th><th>Actions</th></tr></thead><tbody>${overdueRows}</tbody></table></div>` : '<div class="empty">No overdue loans 🎉</div>'}
  <div class="section-title">Pending book requests</div>
  ${pendingRequests.length ? `<div class="table-wrap"><table><thead><tr><th>Book</th><th>Student</th><th>Requested</th><th>Note</th><th>Actions</th></tr></thead><tbody>${pendingRows}</tbody></table></div>` : '<div class="empty">No pending requests</div>'}
  `;
}

// ─── ADMIN: SIGNUPS PAGE ──────────────────────────────────────────────────
async function adminSignups() {
  const users = await dbGetAll('users');
  let students = users.filter(u => u.role === 'student');
  if (filterTab === 'pending')  students = students.filter(u => !u.approved);
  else if (filterTab === 'approved') students = students.filter(u => u.approved);
  if (searchTerm) students = students.filter(u =>
    u.name.toLowerCase().includes(searchTerm) ||
    (u.studentId || '').toLowerCase().includes(searchTerm) ||
    (u.email || '').toLowerCase().includes(searchTerm)
  );
  students.sort((a, b) => new Date(b.joined) - new Date(a.joined));

  const allStudents = users.filter(u => u.role === 'student');
  const counts = {
    all:      allStudents.length,
    pending:  allStudents.filter(u => !u.approved).length,
    approved: allStudents.filter(u => u.approved).length,
  };

  const rows = students.map(u => `<tr>
    <td>
      <div style="display:flex;align-items:center;gap:10px">
        <div class="avatar">${initials(u.name)}</div>
        <div>
          <div style="font-weight:500">${escHtml(u.name)}</div>
          <div style="font-size:11px;color:var(--text-secondary)">${escHtml(u.email)}</div>
        </div>
      </div>
    </td>
    <td><span class="badge admin-badge">${escHtml(u.studentId || '—')}</span></td>
    <td>${escHtml(u.department || '—')}</td>
    <td>${u.year ? 'Year ' + u.year : '—'}</td>
    <td>${escHtml(u.phone || '—')}</td>
    <td>${formatDate(u.joined)}</td>
    <td>
      <span class="badge ${u.approved ? 'approved' : 'pending'}">${u.approved ? 'Approved' : 'Pending'}</span>
      ${u.selfRegistered ? `<span class="badge genre" style="margin-left:4px">Self-registered</span>` : ''}
    </td>
    <td style="white-space:nowrap">
      ${!u.approved ? `<button class="btn sm primary" onclick="approveMember(${u.id})">Approve</button> ` : ''}
      <button class="btn sm"     onclick="editMember(${u.id})">Edit</button>
      <button class="btn sm danger" onclick="deleteMember(${u.id})">Delete</button>
    </td>
  </tr>`).join('');

  return `
  <div class="topbar">
    <h1>Student Registrations</h1>
    <div class="search-wrap"><span class="search-icon">⌕</span><input type="text" placeholder="Search name, ID, email…" value="${escHtml(searchTerm)}" oninput="searchTerm=this.value.toLowerCase();render()"></div>
  </div>
  ${counts.pending > 0
    ? `<div class="alert warn">🆕 ${counts.pending} student${counts.pending > 1 ? 's' : ''} waiting for approval. Review and approve to grant access.</div>`
    : '<div class="alert info">✅ All student registrations are approved.</div>'}
  <div class="tab-row">
    <button class="tab ${filterTab === 'all'      ? 'active' : ''}" onclick="filterTab='all';render()">All (${counts.all})</button>
    <button class="tab ${filterTab === 'pending'  ? 'active' : ''}" onclick="filterTab='pending';render()">Pending (${counts.pending})</button>
    <button class="tab ${filterTab === 'approved' ? 'active' : ''}" onclick="filterTab='approved';render()">Approved (${counts.approved})</button>
  </div>
  <div class="table-wrap"><table>
    <thead><tr><th>Student</th><th>Student ID</th><th>Department</th><th>Year</th><th>Phone</th><th>Registered</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="8" class="empty">No registrations found</td></tr>'}</tbody>
  </table></div>`;
}

// ─── ADMIN: BOOKS PAGE ────────────────────────────────────────────────────
async function adminBooks() {
  const [books, loans] = await Promise.all([dbGetAll('books'), dbGetAll('loans')]);
  const activeLoans = loans.filter(l => !l.returned);
  let filtered = [...books];
  if (searchTerm)             filtered = filtered.filter(b => b.title.toLowerCase().includes(searchTerm) || b.author.toLowerCase().includes(searchTerm) || (b.genre || '').toLowerCase().includes(searchTerm) || (b.isbn || '').includes(searchTerm));
  if (filterStatus === 'available') filtered = filtered.filter(b => b.available > 0);
  if (filterStatus === 'checked')   filtered = filtered.filter(b => b.available < b.copies);

  const cards = filtered.map(book => {
    const bookLoans  = activeLoans.filter(l => l.bookId === book.id);
    const hasOverdue = bookLoans.some(l => calcLateFee(l.dueDate) > 0);
    const hasDueSoon = bookLoans.some(l => { const d = daysUntilDue(l.dueDate); return d >= 0 && d <= 3; });
    let cardClass   = book.available > 0 ? 'available' : '';
    let badgeCls    = book.available > 0 ? 'available' : 'checked';
    let statusLabel = book.available > 0 ? (book.available < book.copies ? `${book.available}/${book.copies} avail` : 'Available') : 'Fully checked out';
    if (hasOverdue)  { cardClass = 'overdue';  badgeCls = 'overdue';  statusLabel = 'Copy overdue'; }
    else if (hasDueSoon) { cardClass = 'due-soon'; badgeCls = 'due-soon'; statusLabel = 'Due soon'; }
    return `<div class="book-card ${cardClass}">
      <div class="card-title">${escHtml(book.title)}</div>
      <div class="card-author">${escHtml(book.author)}${book.year ? ' · ' + book.year : ''}</div>
      <div class="card-meta">
        <span class="badge ${badgeCls}">${statusLabel}</span>
        ${book.genre ? `<span class="badge genre">${escHtml(book.genre)}</span>` : ''}
      </div>
      ${book.isbn ? `<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:8px">ISBN: ${escHtml(book.isbn)}</div>` : ''}
      ${book.description ? `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;line-height:1.4">${escHtml(book.description)}</div>` : ''}
      <div class="card-footer">
        <button class="btn sm" onclick="editBook(${book.id})">Edit</button>
        <button class="btn sm" onclick="deleteBook(${book.id})">Delete</button>
        ${book.available > 0 ? `<button class="btn sm primary" onclick="openCheckout(${book.id})" style="margin-left:auto">Check out</button>` : ''}
      </div>
    </div>`;
  }).join('');

  return `
  <div class="topbar">
    <h1>Books</h1>
    <div class="search-wrap"><span class="search-icon">⌕</span><input type="text" placeholder="Search title, author, genre, ISBN…" value="${escHtml(searchTerm)}" oninput="searchTerm=this.value.toLowerCase();render()"></div>
    <button class="btn primary" onclick="openAddBook()">+ Add book</button>
  </div>
  <div class="filter-row">
    <span class="filter-chip ${filterStatus === 'all'       ? 'on' : ''}" onclick="filterStatus='all';render()">All (${books.length})</span>
    <span class="filter-chip ${filterStatus === 'available' ? 'on' : ''}" onclick="filterStatus='available';render()">Available</span>
    <span class="filter-chip ${filterStatus === 'checked'   ? 'on' : ''}" onclick="filterStatus='checked';render()">Has loans</span>
  </div>
  ${filtered.length ? `<div class="cards-grid">${cards}</div>` : '<div class="empty">No books found</div>'}`;
}

// ─── ADMIN: MEMBERS PAGE ──────────────────────────────────────────────────
async function adminMembers() {
  const [users, loans] = await Promise.all([dbGetAll('users'), dbGetAll('loans')]);
  let students = users.filter(u => u.role === 'student');
  if (searchTerm) students = students.filter(u =>
    u.name.toLowerCase().includes(searchTerm) ||
    u.email.toLowerCase().includes(searchTerm) ||
    (u.studentId || '').toLowerCase().includes(searchTerm)
  );

  const rows = students.map(user => {
    const uLoans = loans.filter(l => l.userId === user.id && !l.returned);
    const fees   = uLoans.reduce((s, l) => s + calcLateFee(l.dueDate), 0);
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:10px"><div class="avatar">${initials(user.name)}</div><div><div style="font-weight:500">${escHtml(user.name)}</div><div style="font-size:11px;color:var(--text-secondary)">${escHtml(user.email)}</div></div></div></td>
      <td><span class="badge admin-badge">${escHtml(user.studentId || '—')}</span></td>
      <td>${escHtml(user.department || '—')}</td>
      <td>${user.year ? 'Year ' + user.year : '—'}</td>
      <td>${uLoans.length}</td>
      <td>${fees > 0 ? `<span style="color:var(--red-dark);font-weight:500">৳${fees.toFixed(2)}</span>` : '৳0.00'}</td>
      <td><span class="badge ${user.approved ? 'approved' : 'pending'}">${user.approved ? 'Active' : 'Pending'}</span></td>
      <td style="white-space:nowrap">
        <button class="btn sm" onclick="editMember(${user.id})">Edit</button>
        ${!user.approved ? `<button class="btn sm primary" onclick="approveMember(${user.id})">Approve</button>` : ''}
        <button class="btn sm" onclick="deleteMember(${user.id})">Delete</button>
      </td>
    </tr>`;
  }).join('');

  return `
  <div class="topbar">
    <h1>Members</h1>
    <div class="search-wrap"><span class="search-icon">⌕</span><input type="text" placeholder="Search name, email, student ID…" value="${escHtml(searchTerm)}" oninput="searchTerm=this.value.toLowerCase();render()"></div>
    <button class="btn primary" onclick="openAddMember()">+ Add member</button>
  </div>
  <div class="table-wrap"><table>
    <thead><tr><th>Member</th><th>Student ID</th><th>Department</th><th>Year</th><th>Active loans</th><th>Fee</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="8" class="empty">No members found</td></tr>'}</tbody>
  </table></div>`;
}

// ─── ADMIN: LOANS PAGE ────────────────────────────────────────────────────
async function adminLoans() {
  const [books, users, loans] = await Promise.all([dbGetAll('books'), dbGetAll('users'), dbGetAll('loans')]);
  let filtered = [...loans];
  if      (filterTab === 'active')   filtered = filtered.filter(l => !l.returned && calcLateFee(l.dueDate) === 0 && daysUntilDue(l.dueDate) > 3);
  else if (filterTab === 'overdue')  filtered = filtered.filter(l => !l.returned && calcLateFee(l.dueDate) > 0);
  else if (filterTab === 'due-soon') filtered = filtered.filter(l => { const d = daysUntilDue(l.dueDate); return !l.returned && d >= 0 && d <= 3; });
  else if (filterTab === 'returned') filtered = filtered.filter(l => l.returned);
  if (searchTerm) filtered = filtered.filter(l => {
    const b = books.find(bk => bk.id === l.bookId);
    const u = users.find(us => us.id === l.userId);
    return (b?.title || '').toLowerCase().includes(searchTerm) || (u?.name || '').toLowerCase().includes(searchTerm);
  });
  filtered.sort((a, b) => new Date(b.checkedOut) - new Date(a.checkedOut));

  const counts = {
    all:       loans.length,
    active:    loans.filter(l => !l.returned && calcLateFee(l.dueDate) === 0 && daysUntilDue(l.dueDate) > 3).length,
    overdue:   loans.filter(l => !l.returned && calcLateFee(l.dueDate) > 0).length,
    'due-soon':loans.filter(l => { const d = daysUntilDue(l.dueDate); return !l.returned && d >= 0 && d <= 3; }).length,
    returned:  loans.filter(l => l.returned).length,
  };

  const rows = filtered.map(loan => {
    const book   = books.find(b => b.id === loan.bookId);
    const user   = users.find(u => u.id === loan.userId);
    const fee    = calcLateFee(loan.dueDate);
    const days   = daysUntilDue(loan.dueDate);
    const status = getLoanStatus(loan);
    const badge  = status === 'overdue'  ? `<span class="badge overdue">Overdue ${Math.abs(days)}d</span>`
                 : status === 'due-soon' ? `<span class="badge due-soon">Due in ${days}d</span>`
                 : status === 'returned' ? `<span class="badge available">Returned</span>`
                 :                         `<span class="badge checked">Active</span>`;
    return `<tr>
      <td><strong>${escHtml(book?.title || '—')}</strong></td>
      <td>${escHtml(user?.name || '—')}</td>
      <td>${formatDate(loan.checkedOut)}</td>
      <td>${formatDate(loan.dueDate)}</td>
      <td>${badge}</td>
      <td>${fee > 0 ? `<span style="color:var(--red-dark);font-weight:500">৳${fee.toFixed(2)}</span>` : '—'}</td>
      <td style="white-space:nowrap;display:flex;gap:4px;flex-wrap:wrap">
        ${!loan.returned ? `<button class="btn sm primary" onclick="returnBook(${loan.id})">Return</button>` : ''}
        ${fee > 0 && !loan.feePaid && !loan.returned ? `<button class="btn sm danger" onclick="payFee(${loan.id},${fee})">Pay fee</button>` : ''}
        ${loan.feePaid ? `<span style="font-size:11px;color:var(--green-dark)">Fee paid</span>` : ''}
        <button class="btn sm" onclick="deleteLoan(${loan.id})">Delete</button>
      </td>
    </tr>`;
  }).join('');

  return `
  <div class="topbar">
    <h1>Loans</h1>
    <div class="search-wrap"><span class="search-icon">⌕</span><input type="text" placeholder="Search book or member…" value="${escHtml(searchTerm)}" oninput="searchTerm=this.value.toLowerCase();render()"></div>
    <button class="btn primary" onclick="openCheckout(null)">+ New loan</button>
  </div>
  <div class="tab-row">
    <button class="tab ${filterTab === 'all'      ? 'active' : ''}" onclick="filterTab='all';render()">All (${counts.all})</button>
    <button class="tab ${filterTab === 'active'   ? 'active' : ''}" onclick="filterTab='active';render()">Active (${counts.active})</button>
    <button class="tab ${filterTab === 'due-soon' ? 'active' : ''}" onclick="filterTab='due-soon';render()">Due soon (${counts['due-soon']})</button>
    <button class="tab ${filterTab === 'overdue'  ? 'active' : ''}" onclick="filterTab='overdue';render()">Overdue (${counts.overdue})</button>
    <button class="tab ${filterTab === 'returned' ? 'active' : ''}" onclick="filterTab='returned';render()">Returned (${counts.returned})</button>
  </div>
  <div class="table-wrap"><table>
    <thead><tr><th>Book</th><th>Member</th><th>Checked out</th><th>Due date</th><th>Status</th><th>Fee</th><th>Actions</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7" class="empty">No loans found</td></tr>'}</tbody>
  </table></div>`;
}

// ─── ADMIN: REQUESTS PAGE ─────────────────────────────────────────────────
async function adminRequests() {
  const [books, users, requests] = await Promise.all([dbGetAll('books'), dbGetAll('users'), dbGetAll('requests')]);
  let filtered = [...requests];
  if (filterTab !== 'all') filtered = filtered.filter(r => r.status === filterTab);
  filtered.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

  const counts = {
    all:      requests.length,
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const rows = filtered.map(req => {
    const book = books.find(b => b.id === req.bookId);
    const user = users.find(u => u.id === req.userId);
    return `<tr>
      <td><strong>${escHtml(book?.title || '—')}</strong></td>
      <td>${escHtml(user?.name || '—')} <span style="font-size:11px;color:var(--text-secondary)">${escHtml(user?.studentId || '')}</span></td>
      <td>${formatDate(req.requestedAt)}</td>
      <td>${escHtml(req.note || '—')}</td>
      <td><span class="badge ${req.status}">${req.status}</span></td>
      <td>${req.adminNote ? escHtml(req.adminNote) : '—'}</td>
      <td style="white-space:nowrap">
        ${req.status === 'pending' ? `<button class="btn sm primary" onclick="approveRequest(${req.id})">Approve</button> <button class="btn sm danger" onclick="rejectRequest(${req.id})">Reject</button>` : ''}
        <button class="btn sm" onclick="deleteRequest(${req.id})">Delete</button>
      </td>
    </tr>`;
  }).join('');

  return `
  <div class="topbar"><h1>Book Requests</h1></div>
  <div class="tab-row">
    <button class="tab ${filterTab === 'all'      ? 'active' : ''}" onclick="filterTab='all';render()">All (${counts.all})</button>
    <button class="tab ${filterTab === 'pending'  ? 'active' : ''}" onclick="filterTab='pending';render()">Pending (${counts.pending})</button>
    <button class="tab ${filterTab === 'approved' ? 'active' : ''}" onclick="filterTab='approved';render()">Approved (${counts.approved})</button>
    <button class="tab ${filterTab === 'rejected' ? 'active' : ''}" onclick="filterTab='rejected';render()">Rejected (${counts.rejected})</button>
  </div>
  <div class="table-wrap"><table>
    <thead><tr><th>Book</th><th>Student</th><th>Requested</th><th>Student note</th><th>Status</th><th>Admin note</th><th>Actions</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7" class="empty">No requests</td></tr>'}</tbody>
  </table></div>`;
}

// ─── ADMIN: ANNOUNCEMENTS PAGE ────────────────────────────────────────────
async function adminAnnouncements() {
  const announcements = await dbGetAll('announcements');
  announcements.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.createdAt) - new Date(a.createdAt));

  const cards = announcements.map(ann => `
    <div style="background:var(--bg-primary);border:0.5px solid var(--border-light);border-radius:var(--radius-lg);padding:1.25rem;${ann.pinned ? 'border-left:3px solid var(--green);' : ''}">
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px">
        <div style="flex:1">
          <div style="font-weight:500;font-size:15px">${escHtml(ann.title)}</div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px">${formatDateTime(ann.createdAt)} · by ${escHtml(ann.author)}</div>
        </div>
        ${ann.pinned ? `<span class="badge available">Pinned</span>` : ''}
      </div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.6">${escHtml(ann.body)}</div>
      <div style="display:flex;gap:6px;margin-top:12px;padding-top:10px;border-top:0.5px solid var(--border-light)">
        <button class="btn sm" onclick="editAnnouncement(${ann.id})">Edit</button>
        <button class="btn sm" onclick="togglePin(${ann.id},${!ann.pinned})">${ann.pinned ? 'Unpin' : 'Pin'}</button>
        <button class="btn sm danger" onclick="deleteAnnouncement(${ann.id})">Delete</button>
      </div>
    </div>
  `).join('');

  return `
  <div class="topbar"><h1>Announcements</h1><button class="btn primary" onclick="openAddAnnouncement()">+ New announcement</button></div>
  ${announcements.length ? `<div style="display:flex;flex-direction:column;gap:1rem">${cards}</div>` : '<div class="empty">No announcements yet</div>'}`;
}

// ─── ADMIN: REPORTS PAGE ──────────────────────────────────────────────────
async function adminReports() {
  const [books, users, loans] = await Promise.all([dbGetAll('books'), dbGetAll('users'), dbGetAll('loans')]);
  const students      = users.filter(u => u.role === 'student');
  const activeLoans   = loans.filter(l => !l.returned);
  const returnedLoans = loans.filter(l => l.returned);
  const overdueLoans  = activeLoans.filter(l => calcLateFee(l.dueDate) > 0);
  const totalFees     = overdueLoans.reduce((s, l) => s + calcLateFee(l.dueDate), 0);

  const genreMap = {};
  books.forEach(b => { genreMap[b.genre || 'Other'] = (genreMap[b.genre || 'Other'] || 0) + b.copies; });
  const genreRows = Object.entries(genreMap).sort((a, b) => b[1] - a[1])
    .map(([g, c]) => `<tr><td>${escHtml(g)}</td><td>${c}</td></tr>`).join('');

  const borrowCount = {};
  loans.forEach(l => { borrowCount[l.bookId] = (borrowCount[l.bookId] || 0) + 1; });
  const topBooks = Object.entries(borrowCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, cnt]) => {
    const b = books.find(bk => bk.id === parseInt(id));
    return `<tr><td>${escHtml(b?.title || '—')}</td><td>${escHtml(b?.author || '—')}</td><td><strong>${cnt}</strong></td></tr>`;
  }).join('');

  const userFees = {};
  overdueLoans.forEach(l => { userFees[l.userId] = (userFees[l.userId] || 0) + calcLateFee(l.dueDate); });
  const feeRows = Object.entries(userFees).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, fee]) => {
    const u = users.find(us => us.id === parseInt(id));
    return `<tr><td>${escHtml(u?.name || '—')}</td><td>${escHtml(u?.studentId || '—')}</td><td style="color:var(--red-dark);font-weight:500">৳${fee.toFixed(2)}</td></tr>`;
  }).join('');

  return `
  <div class="topbar"><h1>Reports & Analytics</h1></div>
  <div class="metrics" style="grid-template-columns:repeat(4,1fr)">
    <div class="metric"><div class="num">${books.length}</div><div class="lbl">Unique titles</div></div>
    <div class="metric"><div class="num">${loans.length}</div><div class="lbl">Total loans ever</div></div>
    <div class="metric"><div class="num">${returnedLoans.length}</div><div class="lbl">Books returned</div></div>
    <div class="metric"><div class="num" style="color:var(--red-dark)">৳${totalFees.toFixed(2)}</div><div class="lbl">Fees outstanding</div></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.5rem;margin-top:0.5rem">
    <div>
      <div class="section-title">Collection by genre</div>
      <div class="table-wrap"><table><thead><tr><th>Genre</th><th>Copies</th></tr></thead><tbody>${genreRows}</tbody></table></div>
    </div>
    <div>
      <div class="section-title">Most borrowed books</div>
      <div class="table-wrap"><table><thead><tr><th>Title</th><th>Author</th><th>Times</th></tr></thead><tbody>${topBooks || '<tr><td colspan="3" class="empty">No data</td></tr>'}</tbody></table></div>
    </div>
    <div>
      <div class="section-title">Members with highest fees</div>
      <div class="table-wrap"><table><thead><tr><th>Name</th><th>ID</th><th>Fee</th></tr></thead><tbody>${feeRows || '<tr><td colspan="3" class="empty">No overdue fees</td></tr>'}</tbody></table></div>
    </div>
  </div>`;
}
