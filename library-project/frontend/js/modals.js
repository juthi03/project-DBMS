/* =====================================================
   modals.js — Modal Management & All CRUD Actions
   Library Management System
   ===================================================== */

let modalMode = '';
let editId    = null;

// ─── MODAL CORE ───────────────────────────────────────────────────────────
function openModal(title, bodyHtml, saveLabel = 'Save') {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML    = bodyHtml;
  document.getElementById('modal-save').textContent  = saveLabel;
  document.getElementById('modal-bg').classList.add('open');
}
function closeModal() {
  document.getElementById('modal-bg').classList.remove('open');
  modalMode = ''; editId = null;
}
function closeModalOutside(e) {
  if (e.target === document.getElementById('modal-bg')) closeModal();
}

// ─── BOOK FORMS ───────────────────────────────────────────────────────────
function bookFormHtml(book = {}) {
  return `
    <div class="field-row">
      <div class="field"><label>Title *</label><input id="f-title" value="${escHtml(book.title || '')}" placeholder="Book title"></div>
      <div class="field"><label>Author *</label><input id="f-author" value="${escHtml(book.author || '')}" placeholder="Author name"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Genre</label><select id="f-genre">${GENRES.map(g => `<option value="${g}"${book.genre === g ? ' selected' : ''}>${g}</option>`).join('')}</select></div>
      <div class="field"><label>Year</label><input id="f-year" type="number" value="${book.year || ''}" placeholder="2024"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>ISBN</label><input id="f-isbn" value="${escHtml(book.isbn || '')}" placeholder="978-..."></div>
      <div class="field"><label>Total copies</label><input id="f-copies" type="number" value="${book.copies || 1}" min="1"></div>
    </div>
    <div class="field"><label>Description</label><textarea id="f-desc" placeholder="Short description…">${escHtml(book.description || '')}</textarea></div>
  `;
}

function openAddBook()        { modalMode = 'add-book'; editId = null; openModal('Add book', bookFormHtml()); }
async function editBook(id)   { const b = await dbGet('books', id); modalMode = 'edit-book'; editId = id; openModal('Edit book', bookFormHtml(b)); }
async function deleteBook(id) {
  const loans = await dbGetAll('loans');
  if (loans.some(l => l.bookId === id && !l.returned)) return alert('Cannot delete: book has active loans. Return them first.');
  if (!confirm('Delete this book?')) return;
  await dbDelete('books', id); await render();
}

// ─── MEMBER FORMS ─────────────────────────────────────────────────────────
function memberFormHtml(u = {}) {
  return `
    <div class="field-row">
      <div class="field"><label>Full name *</label><input id="f-name" value="${escHtml(u.name || '')}" placeholder="Full name"></div>
      <div class="field"><label>Student ID *</label><input id="f-sid" value="${escHtml(u.studentId || '')}" placeholder="STU001"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Email *</label><input id="f-email" type="email" value="${escHtml(u.email || '')}" placeholder="email@student.edu"></div>
      <div class="field"><label>Phone</label><input id="f-phone" value="${escHtml(u.phone || '')}" placeholder="01711-000000"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Department</label><select id="f-dept">${DEPTS.map(d => `<option value="${d}"${u.department === d ? ' selected' : ''}>${d}</option>`).join('')}</select></div>
      <div class="field"><label>Year</label><select id="f-year"><option value="">—</option>${[1,2,3,4,5].map(y => `<option value="${y}"${u.year === y ? ' selected' : ''}>${y}</option>`).join('')}</select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Username (login)</label><input id="f-uname" value="${escHtml(u.username || '')}" placeholder="Same as Student ID"></div>
      <div class="field"><label>Password</label><input id="f-pass" type="password" placeholder="${u.id ? 'Leave blank to keep' : 'Set password'}"></div>
    </div>
  `;
}

function openAddMember()        { modalMode = 'add-member'; editId = null; openModal('Add member', memberFormHtml()); }
async function editMember(id)   { const u = await dbGet('users', id); modalMode = 'edit-member'; editId = id; openModal('Edit member', memberFormHtml(u)); }
async function deleteMember(id) {
  const loans = await dbGetAll('loans');
  if (loans.some(l => l.userId === id && !l.returned)) return alert('Cannot delete: member has active loans.');
  if (!confirm('Delete / reject this member?')) return;
  await dbDelete('users', id); await render();
}
async function approveMember(id) {
  const u = await dbGet('users', id); u.approved = true; await dbPut('users', u); await render();
}

// ─── CHECKOUT ─────────────────────────────────────────────────────────────
async function openCheckout(preselectedBookId = null) {
  const [books, users] = await Promise.all([dbGetAll('books'), dbGetAll('users')]);
  const avail    = books.filter(b => b.available > 0);
  const students = users.filter(u => u.role === 'student' && u.approved);
  if (!avail.length)    return alert('No books available for checkout.');
  if (!students.length) return alert('No approved students found.');
  modalMode = 'checkout'; editId = null;
  openModal('Check out book', `
    <div class="field"><label>Book *</label><select id="f-bookid">${avail.map(b => `<option value="${b.id}"${b.id === preselectedBookId ? ' selected' : ''}>${escHtml(b.title)} (${b.available} avail)</option>`).join('')}</select></div>
    <div class="field"><label>Student *</label><select id="f-userid">${students.map(u => `<option value="${u.id}">${escHtml(u.name)} — ${escHtml(u.studentId || '')}</option>`).join('')}</select></div>
    <div class="field"><label>Due date *</label><input type="date" id="f-due" value="${defaultDueDate()}" min="${new Date().toISOString().split('T')[0]}"></div>
    <div class="alert info" style="margin-top:0.5rem">Late fee: ৳0.50 per day after due date.</div>
  `, 'Check out');
}

async function returnBook(loanId) {
  if (!confirm('Mark this book as returned?')) return;
  const loan = await dbGet('loans', loanId);
  loan.returned  = true;
  loan.returnedOn = new Date().toISOString();
  await dbPut('loans', loan);
  const book = await dbGet('books', loan.bookId);
  book.available = Math.min(book.copies, book.available + 1);
  await dbPut('books', book); await render();
}

async function payFee(loanId, fee) {
  if (!confirm(`Mark ৳${fee.toFixed(2)} fee as paid?`)) return;
  const loan = await dbGet('loans', loanId);
  loan.feePaid   = true;
  loan.feePaidOn = new Date().toISOString();
  await dbPut('loans', loan); await render();
}

async function deleteLoan(id) {
  if (!confirm('Delete this loan record?')) return;
  const loan = await dbGet('loans', id);
  if (!loan.returned) {
    const b = await dbGet('books', loan.bookId);
    b.available = Math.min(b.copies, b.available + 1);
    await dbPut('books', b);
  }
  await dbDelete('loans', id); await render();
}

// ─── BOOK REQUESTS ────────────────────────────────────────────────────────
async function openRequestBook(preselectedBookId = null) {
  const books = await dbGetAll('books');
  const opts  = books.map(b => `<option value="${b.id}"${b.id === preselectedBookId ? ' selected' : ''}>${escHtml(b.title)} (${b.available > 0 ? b.available + ' avail' : 'Unavailable'})</option>`).join('');
  modalMode = 'request-book'; editId = null;
  openModal('Request a book', `
    <div class="field"><label>Book *</label><select id="f-bookid">${opts}</select></div>
    <div class="field"><label>Note to librarian (optional)</label><textarea id="f-note" placeholder="Why do you need this book?"></textarea></div>
    <div class="alert blue">Your request will be reviewed by admin. You will see the status in My Requests.</div>
  `, 'Submit request');
}

async function approveRequest(reqId) {
  const req  = await dbGet('requests', reqId);
  const note = prompt('Optional note to student (or leave blank):', '');
  req.status     = 'approved';
  req.adminNote  = note || '';
  req.reviewedAt = new Date().toISOString();
  await dbPut('requests', req); await render();
}

async function rejectRequest(reqId) {
  const req  = await dbGet('requests', reqId);
  const note = prompt('Reason for rejection (optional):', '');
  req.status     = 'rejected';
  req.adminNote  = note || '';
  req.reviewedAt = new Date().toISOString();
  await dbPut('requests', req); await render();
}

async function cancelRequest(reqId) {
  if (!confirm('Cancel this request?')) return;
  await dbDelete('requests', reqId); await render();
}

async function deleteRequest(id) {
  if (!confirm('Delete this request record?')) return;
  await dbDelete('requests', id); await render();
}

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────
function announcementFormHtml(ann = {}) {
  return `
    <div class="field"><label>Title *</label><input id="f-title" value="${escHtml(ann.title || '')}" placeholder="Announcement title"></div>
    <div class="field"><label>Body *</label><textarea id="f-body" rows="4" placeholder="Announcement body…">${escHtml(ann.body || '')}</textarea></div>
    <div class="field"><label><input type="checkbox" id="f-pinned" ${ann.pinned ? 'checked' : ''}> Pin this announcement</label></div>
  `;
}
function openAddAnnouncement()          { modalMode = 'add-ann'; editId = null; openModal('New announcement', announcementFormHtml()); }
async function editAnnouncement(id)     { const a = await dbGet('announcements', id); modalMode = 'edit-ann'; editId = id; openModal('Edit announcement', announcementFormHtml(a)); }
async function togglePin(id, pin)       { const a = await dbGet('announcements', id); a.pinned = pin; await dbPut('announcements', a); await render(); }
async function deleteAnnouncement(id)   { if (!confirm('Delete this announcement?')) return; await dbDelete('announcements', id); await render(); }

// ─── STUDENT PROFILE EDIT ─────────────────────────────────────────────────
function openEditProfile() {
  const u = currentUser; modalMode = 'edit-profile'; editId = u.id;
  openModal('Edit profile', `
    <div class="field"><label>Full name</label><input id="f-name" value="${escHtml(u.name || '')}"></div>
    <div class="field"><label>Email</label><input id="f-email" type="email" value="${escHtml(u.email || '')}"></div>
    <div class="field"><label>Phone</label><input id="f-phone" value="${escHtml(u.phone || '')}"></div>
    <div class="field"><label>Department</label><select id="f-dept">${DEPTS.map(d => `<option value="${d}"${u.department === d ? ' selected' : ''}>${d}</option>`).join('')}</select></div>
    <div class="field"><label>Year</label><select id="f-year"><option value="">—</option>${[1,2,3,4,5].map(y => `<option value="${y}"${u.year === y ? ' selected' : ''}>${y}</option>`).join('')}</select></div>
  `);
}

function openChangePassword() {
  modalMode = 'change-pass'; editId = currentUser.id;
  openModal('Change password', `
    <div class="field"><label>Current password</label><input type="password" id="f-old-pass"></div>
    <div class="field"><label>New password</label><input type="password" id="f-new-pass"></div>
    <div class="field"><label>Confirm new password</label><input type="password" id="f-conf-pass"></div>
  `, 'Update password');
}

// ─── MODAL SAVE DISPATCHER ────────────────────────────────────────────────
async function saveModal() {
  try {
    if      (modalMode === 'add-book'    || modalMode === 'edit-book')    await saveBook();
    else if (modalMode === 'add-member'  || modalMode === 'edit-member')  await saveMember();
    else if (modalMode === 'checkout')                                     await saveCheckout();
    else if (modalMode === 'request-book')                                 await saveRequest();
    else if (modalMode === 'add-ann'     || modalMode === 'edit-ann')     await saveAnnouncement();
    else if (modalMode === 'edit-profile')                                 await saveProfile();
    else if (modalMode === 'change-pass')                                  await saveChangePassword();
  } catch (err) { alert('Error: ' + err.message); }
}

async function saveBook() {
  const title  = document.getElementById('f-title').value.trim();
  const author = document.getElementById('f-author').value.trim();
  if (!title)  return alert('Title is required.');
  if (!author) return alert('Author is required.');
  const copies = Math.max(1, parseInt(document.getElementById('f-copies').value) || 1);
  const data = {
    title, author,
    genre:       document.getElementById('f-genre').value,
    isbn:        document.getElementById('f-isbn').value.trim(),
    year:        parseInt(document.getElementById('f-year').value) || null,
    copies,
    description: document.getElementById('f-desc').value.trim(),
  };
  if (modalMode === 'add-book') {
    data.available = copies;
    await dbAdd('books', data);
  } else {
    const ex   = await dbGet('books', editId);
    const diff = copies - ex.copies;
    await dbPut('books', { ...ex, ...data, available: Math.max(0, ex.available + diff) });
  }
  closeModal(); await render();
}

async function saveMember() {
  const name  = document.getElementById('f-name').value.trim();
  const sid   = document.getElementById('f-sid').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const pass  = document.getElementById('f-pass').value.trim();
  const uname = document.getElementById('f-uname').value.trim();
  if (!name || !sid || !email) return alert('Name, Student ID, and email are required.');
  const data = {
    name, studentId: sid, email,
    phone:      document.getElementById('f-phone').value.trim(),
    department: document.getElementById('f-dept').value,
    year:       parseInt(document.getElementById('f-year').value) || null,
    role: 'student', approved: true,
    username: uname || sid,
  };
  if (modalMode === 'add-member') {
    data.password = pass || sid;
    data.joined   = new Date().toISOString();
    await dbAdd('users', data);
  } else {
    const ex = await dbGet('users', editId);
    await dbPut('users', { ...ex, ...data, password: pass || ex.password });
  }
  closeModal(); await render();
}

async function saveCheckout() {
  const bookId  = parseInt(document.getElementById('f-bookid').value);
  const userId  = parseInt(document.getElementById('f-userid').value);
  const dueDate = document.getElementById('f-due').value;
  if (!dueDate) return alert('Please set a due date.');
  await dbAdd('loans', { bookId, userId, checkedOut: new Date().toISOString(), dueDate, returned: false, feePaid: false });
  const book = await dbGet('books', bookId);
  book.available = Math.max(0, book.available - 1);
  await dbPut('books', book);
  closeModal(); await render();
}

async function saveRequest() {
  const bookId = parseInt(document.getElementById('f-bookid').value);
  const note   = document.getElementById('f-note').value.trim();
  const existing = await dbGetAll('requests');
  if (existing.some(r => r.bookId === bookId && r.userId === currentUser.id && r.status === 'pending'))
    return alert('You already have a pending request for this book.');
  await dbAdd('requests', { bookId, userId: currentUser.id, requestedAt: new Date().toISOString(), status: 'pending', note, adminNote: '' });
  closeModal(); await render();
}

async function saveAnnouncement() {
  const title  = document.getElementById('f-title').value.trim();
  const body   = document.getElementById('f-body').value.trim();
  if (!title || !body) return alert('Title and body are required.');
  const pinned = document.getElementById('f-pinned').checked;
  if (modalMode === 'add-ann') {
    await dbAdd('announcements', { title, body, pinned, author: currentUser.name, createdAt: new Date().toISOString() });
  } else {
    const ex = await dbGet('announcements', editId);
    await dbPut('announcements', { ...ex, title, body, pinned });
  }
  closeModal(); await render();
}

async function saveProfile() {
  const name  = document.getElementById('f-name').value.trim();
  const email = document.getElementById('f-email').value.trim();
  if (!name || !email) return alert('Name and email are required.');
  const u = await dbGet('users', currentUser.id);
  const updated = {
    ...u, name, email,
    phone:      document.getElementById('f-phone').value.trim(),
    department: document.getElementById('f-dept').value,
    year:       parseInt(document.getElementById('f-year').value) || null,
  };
  await dbPut('users', updated);
  currentUser = updated;
  closeModal(); await render();
}

async function saveChangePassword() {
  const oldPass  = document.getElementById('f-old-pass').value;
  const newPass  = document.getElementById('f-new-pass').value;
  const confPass = document.getElementById('f-conf-pass').value;
  const u = await dbGet('users', currentUser.id);
  if (oldPass !== u.password)  return alert('Current password is incorrect.');
  if (newPass.length < 4)      return alert('New password must be at least 4 characters.');
  if (newPass !== confPass)    return alert('New passwords do not match.');
  u.password = newPass;
  await dbPut('users', u);
  currentUser = u;
  closeModal(); alert('Password updated successfully!');
}
