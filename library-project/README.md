# 🚀 Project Name: 📚 Library Management System

## 📖 **Overview**
The Library Management System is a software application designed to efficiently manage library operations such as book issuing, returning, and record keeping. It helps reduce manual work by organizing data digitally and improving accuracy. This system ensures easy access, better tracking, and smooth management of library resources.

## 👥 **Group Details**
- **Group Number:** **08**  
- **Course Name:** **Database Management System Lab**  
- **Instructor:** **Fahmidur Rahman Sakib**
- 
### 👨‍💻 Group Members Contributions:
- **Halima Begum (ID: 241-115-041)** – **ER Diagram Design**  
- **Srishtee Talukder (ID: 241-115-034)** – **Database Design & Management**  
- **Sumi Das (ID: 241-115-015)** – **Backend Development**  
- **Mokarroma Khanam Juthi (ID: 241-115-003)** – **Frontend Development & Overall Project Coordination**

- ## 🎯 **Objective**

The objective of this project is to overcome the limitations of manual library management by developing a digital system that automates book issuing, returning, and record tracking. It improves efficiency, reduces errors, and ensures well-organized data handling, making library management faster and more reliable.

-  
A fully client-side Library Management System built with vanilla HTML, CSS, and JavaScript. Uses **IndexedDB** for persistent in-browser storage — no backend or server required to run.

---

## 🗂️ Project Structure

```
/project-root
├── frontend/
│   ├── index.html          ← Main HTML shell (login, signup, app layout)
│   ├── css/
│   │   └── styles.css      ← All styles (layout, components, dark mode)
│   └── js/
│       ├── db.js           ← IndexedDB layer + seed data
│       ├── utils.js        ← Shared utilities (fee calc, date format, etc.)
│       ├── auth.js         ← Login, logout, 3-step signup flow
│       ├── nav.js          ← Sidebar, page routing, render dispatcher
│       ├── admin.js        ← Admin page renderers (dashboard, books, etc.)
│       ├── student.js      ← Student page renderers (catalog, loans, etc.)
│       ├── modals.js       ← Modal management + all CRUD actions
│       └── app.js          ← App init + global event listeners
├── backend/
│   └── README.md           ← Planned REST API spec (future server backend)
├── database/
│   └── schema.sql          ← PostgreSQL schema + indexes + views + seed
├── ER-diagram/
│   └── er-diagram.html     ← Visual ER diagram (open in browser)
└── README.md               ← This file
```

---

## ✨ Features

### Admin
- Dashboard with overdue loans, outstanding fees, pending requests & signups
- Full CRUD for books (with availability tracking)
- Member management (add, edit, approve, delete)
- Loan management (checkout, return, pay fees)
- Book request review (approve / reject with notes)
- Student signup approval queue
- Announcements (create, pin, edit, delete)
- Reports: genre breakdown, most borrowed, top fees

### Student
- 3-step self-registration (requires admin approval)
- Personal dashboard with active loans & fees
- Browse full book catalog & request books
- View loan history with status and fee details
- View announcements
- Edit profile & change password

---

## 🚀 How to Run

1. Open `frontend/index.html` in any modern browser
2. Use the **Admin** tab to log in:
   - Username: `admin` / Password: `admin123`
3. Or use the **Student** tab:
   - Student ID: `STU001`, `STU002`, or `STU003`
   - Password = Student ID

> No npm install, no build step, no server needed.

---

## 💰 Business Rules

| Rule              | Value                          |
|-------------------|--------------------------------|
| Late fee          | ৳0.50 per day after due date   |
| Default loan period | 14 days                      |
| Student signup    | Requires admin approval        |
| Duplicate request | One pending request per book   |

---

## 🗄️ Storage

All data is stored in the browser's **IndexedDB** (`LibraryDB_v3`).  
To reset all data, open DevTools → Application → IndexedDB → delete `LibraryDB_v3`.

### Stores
| Store          | Purpose                     |
|----------------|-----------------------------|
| users          | Admins and students         |
| books          | Book catalog                |
| loans          | Checkout / return records   |
| requests       | Student book requests       |
| announcements  | Library notices             |

---

## 🖥️ Browser Support

Works in all modern browsers: Chrome, Firefox, Edge, Safari.  
Requires IndexedDB support (all modern browsers have this).

---

## 📐 ER Diagram

Open `ER-diagram/er-diagram.html` in a browser to view the entity relationship diagram.

---

## 🔮 Future Roadmap

- [ ] Express.js REST API backend (see `backend/README.md`)
- [ ] PostgreSQL database (see `database/schema.sql`)
- [ ] JWT authentication
- [ ] Email notifications for due dates
- [ ] Barcode / QR code scanning
- [ ] Book cover images via ISBN lookup
- [ ] Export reports as CSV/PDF

## 🎥 **Demo Video**
[▶️ Watch Project Demo]()https://drive.google.com/file/d/1nUXlhzcy59cDCk8z6K2vADlUmQF53PlG/view?usp=drive_link  

