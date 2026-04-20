/* =====================================================
   db.js — IndexedDB Database Layer
   Library Management System
   ===================================================== */

const DB_NAME = 'LibraryDB_v3', DB_VERSION = 3;
let db;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('books')) {
        const bs = d.createObjectStore('books', { keyPath: 'id', autoIncrement: true });
        bs.createIndex('title', 'title'); bs.createIndex('genre', 'genre');
      }
      if (!d.objectStoreNames.contains('users')) {
        const us = d.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        us.createIndex('username', 'username', { unique: true });
        us.createIndex('role', 'role');
      }
      if (!d.objectStoreNames.contains('loans')) {
        const ls = d.createObjectStore('loans', { keyPath: 'id', autoIncrement: true });
        ls.createIndex('bookId', 'bookId'); ls.createIndex('userId', 'userId');
      }
      if (!d.objectStoreNames.contains('requests')) {
        const rs = d.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
        rs.createIndex('userId', 'userId'); rs.createIndex('status', 'status');
      }
      if (!d.objectStoreNames.contains('announcements')) {
        d.createObjectStore('announcements', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

function dbGet(s, id) {
  return new Promise((r, e) => {
    const t = db.transaction(s, 'readonly');
    const q = t.objectStore(s).get(id);
    q.onsuccess = () => r(q.result); q.onerror = () => e(q.error);
  });
}

function dbGetAll(s) {
  return new Promise((r, e) => {
    const t = db.transaction(s, 'readonly');
    const q = t.objectStore(s).getAll();
    q.onsuccess = () => r(q.result); q.onerror = () => e(q.error);
  });
}

function dbAdd(s, item) {
  return new Promise((r, e) => {
    const t = db.transaction(s, 'readwrite');
    const q = t.objectStore(s).add(item);
    q.onsuccess = () => r(q.result); q.onerror = () => e(q.error);
  });
}

function dbPut(s, item) {
  return new Promise((r, e) => {
    const t = db.transaction(s, 'readwrite');
    const q = t.objectStore(s).put(item);
    q.onsuccess = () => r(q.result); q.onerror = () => e(q.error);
  });
}

function dbDelete(s, id) {
  return new Promise((r, e) => {
    const t = db.transaction(s, 'readwrite');
    const q = t.objectStore(s).delete(id);
    q.onsuccess = () => r(); q.onerror = () => e(q.error);
  });
}

function dbGetByIndex(s, idx, val) {
  return new Promise((r, e) => {
    const t = db.transaction(s, 'readonly');
    const q = t.objectStore(s).index(idx).get(val);
    q.onsuccess = () => r(q.result); q.onerror = () => e(q.error);
  });
}

/* =====================================================
   SEED DATA — Runs only on first launch
   ===================================================== */
async function seedIfEmpty() {
  const users = await dbGetAll('users');
  if (users.length > 0) return;

  await dbAdd('users', {
    username: 'admin', password: 'admin123', role: 'admin',
    name: 'Admin User', email: 'admin@library.com', phone: '',
    joined: new Date().toISOString()
  });

  const students = [
    { username: 'STU001', password: 'STU001', role: 'student', name: 'Alice Johnson', email: 'alice@student.edu', phone: '01711-000001', studentId: 'STU001', department: 'Computer Science', year: 2, joined: new Date().toISOString(), approved: true },
    { username: 'STU002', password: 'STU002', role: 'student', name: 'Bob Rahman',   email: 'bob@student.edu',   phone: '01712-000002', studentId: 'STU002', department: 'Physics',           year: 3, joined: new Date().toISOString(), approved: true },
    { username: 'STU003', password: 'STU003', role: 'student', name: 'Carol Ahmed',  email: 'carol@student.edu', phone: '01713-000003', studentId: 'STU003', department: 'Mathematics',       year: 1, joined: new Date().toISOString(), approved: true },
  ];
  for (const s of students) await dbAdd('users', s);

  const books = [
    { title: 'The Midnight Library',       author: 'Matt Haig',            genre: 'Fiction',   isbn: '978-0525559474', year: 2020, copies: 3, available: 3, description: 'A novel about all the lives you could have lived.' },
    { title: 'Atomic Habits',              author: 'James Clear',           genre: 'Self-Help', isbn: '978-0735211292', year: 2018, copies: 2, available: 2, description: 'Tiny changes, remarkable results.' },
    { title: 'Dune',                       author: 'Frank Herbert',         genre: 'Sci-Fi',    isbn: '978-0441013593', year: 1965, copies: 4, available: 4, description: 'A sweeping science fiction epic set on desert planet Arrakis.' },
    { title: 'The Great Gatsby',           author: 'F. Scott Fitzgerald',   genre: 'Classic',   isbn: '978-0743273565', year: 1925, copies: 2, available: 2, description: 'The story of the fabulously wealthy Jay Gatsby.' },
    { title: 'Educated',                   author: 'Tara Westover',         genre: 'Memoir',    isbn: '978-0399590504', year: 2018, copies: 1, available: 1, description: 'A memoir about growing up in a survivalist family.' },
    { title: 'Project Hail Mary',          author: 'Andy Weir',             genre: 'Sci-Fi',    isbn: '978-0593135204', year: 2021, copies: 2, available: 2, description: 'A lone astronaut must save the earth.' },
    { title: 'Sapiens',                    author: 'Yuval Noah Harari',     genre: 'History',   isbn: '978-0062316110', year: 2011, copies: 3, available: 3, description: 'A brief history of humankind.' },
    { title: 'The Alchemist',             author: 'Paulo Coelho',          genre: 'Fiction',   isbn: '978-0062315007', year: 1988, copies: 2, available: 2, description: 'A philosophical novel about following your dreams.' },
    { title: 'Introduction to Algorithms', author: 'Cormen et al.',         genre: 'Academic',  isbn: '978-0262033848', year: 2009, copies: 3, available: 3, description: 'The definitive reference for algorithms.' },
    { title: 'Clean Code',                 author: 'Robert C. Martin',      genre: 'Academic',  isbn: '978-0132350884', year: 2008, copies: 2, available: 2, description: 'A handbook of agile software craftsmanship.' },
  ];
  for (const b of books) await dbAdd('books', b);

  const allBooks  = await dbGetAll('books');
  const allUsers  = await dbGetAll('users');
  const students2 = allUsers.filter(u => u.role === 'student');

  // Seed overdue loan
  await dbAdd('loans', {
    bookId: allBooks[0].id, userId: students2[0].id,
    checkedOut: new Date(Date.now() - 21 * 86400000).toISOString(),
    dueDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    returned: false, feePaid: false
  });
  await dbPut('books', { ...allBooks[0], available: allBooks[0].available - 1 });

  // Seed active loan (due soon)
  await dbAdd('loans', {
    bookId: allBooks[1].id, userId: students2[1].id,
    checkedOut: new Date(Date.now() - 11 * 86400000).toISOString(),
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    returned: false, feePaid: false
  });
  await dbPut('books', { ...allBooks[1], available: allBooks[1].available - 1 });

  await dbAdd('announcements', {
    title: 'Welcome to the new Library System!',
    body: 'Students can now register online and request books. Check your dashboard for due dates and fees.',
    author: 'Admin', createdAt: new Date().toISOString(), pinned: true
  });
  await dbAdd('announcements', {
    title: 'Library Hours Update',
    body: 'The library is now open Monday–Saturday, 8 AM to 8 PM. Sunday hours are 10 AM to 4 PM.',
    author: 'Admin', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), pinned: false
  });

  await dbAdd('requests', {
    bookId: allBooks[2].id, userId: students2[2].id,
    requestedAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'pending', note: 'Need for my sci-fi assignment.', adminNote: ''
  });
}
