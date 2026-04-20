# Backend — Library Management System

> **Note:** The current implementation is a fully client-side single-page application using IndexedDB for local browser storage. This folder is reserved for a future server-side backend.

---

## Planned Stack

| Layer       | Technology           |
|-------------|----------------------|
| Runtime     | Node.js (Express)    |
| Database    | PostgreSQL / MongoDB |
| Auth        | JWT / Sessions       |
| API Style   | RESTful JSON API     |

---

## Planned API Endpoints

### Auth
| Method | Endpoint           | Description              |
|--------|--------------------|--------------------------|
| POST   | /api/auth/login    | Login (admin or student) |
| POST   | /api/auth/signup   | Student self-registration|
| POST   | /api/auth/logout   | Logout                   |

### Books
| Method | Endpoint           | Description           |
|--------|--------------------|-----------------------|
| GET    | /api/books         | List all books        |
| POST   | /api/books         | Add a new book        |
| PUT    | /api/books/:id     | Update a book         |
| DELETE | /api/books/:id     | Delete a book         |

### Users / Members
| Method | Endpoint           | Description           |
|--------|--------------------|-----------------------|
| GET    | /api/users         | List all students     |
| POST   | /api/users         | Add a student         |
| PUT    | /api/users/:id     | Update a student      |
| DELETE | /api/users/:id     | Delete a student      |
| PATCH  | /api/users/:id/approve | Approve signup   |

### Loans
| Method | Endpoint              | Description            |
|--------|-----------------------|------------------------|
| GET    | /api/loans            | List all loans         |
| POST   | /api/loans            | Create new loan        |
| PATCH  | /api/loans/:id/return | Mark as returned       |
| PATCH  | /api/loans/:id/pay    | Mark fee as paid       |
| DELETE | /api/loans/:id        | Delete loan record     |

### Requests
| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| GET    | /api/requests             | List requests        |
| POST   | /api/requests             | Student submits      |
| PATCH  | /api/requests/:id/approve | Admin approves       |
| PATCH  | /api/requests/:id/reject  | Admin rejects        |
| DELETE | /api/requests/:id         | Delete request       |

### Announcements
| Method | Endpoint               | Description               |
|--------|------------------------|---------------------------|
| GET    | /api/announcements     | List all announcements    |
| POST   | /api/announcements     | Create announcement       |
| PUT    | /api/announcements/:id | Update announcement       |
| DELETE | /api/announcements/:id | Delete announcement       |

---

## Business Rules

- Late fee: **৳0.50 per day** after due date
- Default loan period: **14 days**
- Student self-registrations require **admin approval** before login is allowed
- A student cannot have two pending requests for the same book

---

## Environment Variables (future)

```env
PORT=3000
DB_URL=postgresql://user:pass@localhost:5432/library
JWT_SECRET=your_jwt_secret_here
FEE_PER_DAY=0.50
DEFAULT_LOAN_DAYS=14
```
