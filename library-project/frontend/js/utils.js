/* =====================================================
   utils.js — Shared Utility & Business Logic Functions
   Library Management System
   ===================================================== */

const FEE_PER_DAY = 0.50;

/**
 * Calculate late fee for a loan based on its due date.
 * @param {string} dueDate - ISO date string
 * @returns {number} fee amount in BDT
 */
function calcLateFee(dueDate) {
  const due = new Date(dueDate), now = new Date();
  due.setHours(0, 0, 0, 0); now.setHours(0, 0, 0, 0);
  if (now <= due) return 0;
  return +(Math.floor((now - due) / 86400000) * FEE_PER_DAY).toFixed(2);
}

/**
 * Get days until/since due date. Negative = overdue.
 * @param {string} dueDate
 * @returns {number}
 */
function daysUntilDue(dueDate) {
  const due = new Date(dueDate), now = new Date();
  due.setHours(0, 0, 0, 0); now.setHours(0, 0, 0, 0);
  return Math.ceil((due - now) / 86400000);
}

/**
 * Determine loan status string.
 * @param {object} loan
 * @returns {'returned'|'overdue'|'due-soon'|'active'}
 */
function getLoanStatus(loan) {
  if (loan.returned) return 'returned';
  if (calcLateFee(loan.dueDate) > 0) return 'overdue';
  if (daysUntilDue(loan.dueDate) <= 3) return 'due-soon';
  return 'active';
}

/**
 * Returns a default due date 14 days from today.
 * @returns {string} YYYY-MM-DD
 */
function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split('T')[0];
}

/**
 * Format an ISO date string to a human-friendly date.
 * @param {string} s
 * @returns {string}
 */
function formatDate(s) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format an ISO date string to a human-friendly date + time.
 * @param {string} s
 * @returns {string}
 */
function formatDateTime(s) {
  if (!s) return '—';
  return new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Get initials (up to 2 letters) from a full name.
 * @param {string} name
 * @returns {string}
 */
function initials(name) {
  return (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} s
 * @returns {string}
 */
function escHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
