/* =====================================================
   app.js — App Initialization & Global Event Listeners
   Library Management System
   ===================================================== */

// ─── KEYBOARD SHORTCUTS ───────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

document.getElementById('login-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

// ─── INIT ──────────────────────────────────────────────────────────────────
(async () => {
  await openDB();
  await seedIfEmpty();
})();
