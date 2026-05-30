# ✦ ApplyBuddy

**Your personal profile vault — fully dynamic, fully yours.**

ApplyBuddy is a sleek, modern profile manager where you store all the information you repeatedly type into forms — personal details, government IDs, addresses, online accounts, and anything else you need. No hardcoded fields. Every section, every field, every label is created, edited, and deleted by you, inside the app itself.


## ⚡ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework with functional components and hooks |
| **Vite** | Lightning-fast dev server and build tool |
| **Framer Motion** | Spring physics animations, layout transitions, staggered mounts |
| **Vanilla CSS** | Custom design system with CSS variables — no Tailwind |
| **Google Fonts** | Syne (headings) + DM Mono (monospaced body) |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **PostgreSQL** | Persistent database with JSONB storage for dynamic profile data |
| **JSON Web Tokens** | Stateless authentication with 7-day token expiry |
| **bcrypt.js** | Password hashing with salt rounds |
| **dotenv** | Environment variable management |

---

## 🧩 Features

### Dynamic Profile Management
- **Custom Sections** — Add, rename, and delete sections (e.g. "Personal Info", "Bank Details", "Social Links")
- **Custom Fields** — Add fields inside any section with a label, type, and value
- **Supported Field Types** — `text`, `email`, `tel`, `date`, `number`, `url`, `textarea`
- **Inline Editing** — Click the pencil icon on any field to change its label or type
- **Auto-Save** — Every change saves instantly. No save button needed.

### Authentication
- **Sign Up / Sign In** — JWT-based authentication with bcrypt password hashing
- **Session Persistence** — Token stored in localStorage, survives page refresh
- **Per-User Data** — Each user has their own isolated profile vault

### Dual Themes
- **Void** — Dark mode with electric green accents (`#00ff88`)
- **Paper** — Warm off-white with deep green accents (`#1a6b3c`)
- **Zero Flash** — Theme loads before React via an inline `<script>` in the HTML head
- **Smooth Transition** — All colors animate between themes over 350ms

### Micro-Animations
- **Sidebar** — Letter-by-letter stagger on the app name, sliding active dot between nav links
- **Sections** — Staggered mount (0.08s per card), collapse animation on delete
- **Fields** — Slide-in on add, collapse on delete, hover accent bar
- **Toast** — Spring-animated "✦ saved" notification, auto-dismiss in 1.5s
- **Custom Cursor** — Spring-lag follower that expands on interactive elements (hidden on touch devices)
- **Theme Toggle** — Rotating icon with a full-app opacity flash

---

## 📁 Project Structure

```
ApplyBuddy/
├── backend/
│   ├── .env                          # DB credentials, JWT secret, port
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── index.js                  # Express server entry point
│       ├── db/
│       │   ├── pool.js               # PostgreSQL connection pool
│       │   └── init.js               # Auto-creates tables on startup
│       ├── middleware/
│       │   └── auth.js               # JWT token verification
│       └── routes/
│           ├── auth.js               # POST /register, /login
│           └── profile.js            # GET/POST /profile (protected)
│
└── frontend/
    ├── index.html                    # Fonts, title, theme flash prevention
    ├── vite.config.js                # Dev proxy → backend:5000
    ├── package.json
    └── src/
        ├── main.jsx                  # React root
        ├── index.css                 # Full design system + both themes
        ├── useProfile.js             # Data hook — API sync + localStorage cache
        ├── App.jsx                   # Auth guard + layout shell
        └── components/
            ├── AuthScreen.jsx        # Login / Signup UI
            ├── Sidebar.jsx           # Nav, theme toggle, user bar
            ├── SectionBlock.jsx      # Section card with CRUD controls
            ├── FieldRow.jsx          # Single field with inline edit
            ├── AddFieldForm.jsx      # New field creation form
            ├── Toast.jsx             # Save notification
            └── Cursor.jsx            # Custom animated cursor
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ✗ | Create account → returns JWT |
| `POST` | `/api/auth/login` | ✗ | Verify credentials → returns JWT |
| `GET` | `/api/profile` | Bearer | Fetch user's profile data |
| `POST` | `/api/profile` | Bearer | Save/update profile data (JSONB upsert) |
| `GET` | `/health` | ✗ | Server health check |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** running locally or remotely

### 1. Clone and set up the database

```sql
CREATE DATABASE applybuddy;
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your PostgreSQL credentials:

```env
PORT=5000
JWT_SECRET=change_this_to_a_secure_random_string
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/applybuddy
NODE_ENV=development
```

### 3. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Start the app

```bash
# Terminal 1 — Backend
cd backend
npm start

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open the URL shown by Vite (typically **http://localhost:5173**).

---

## 🗄️ Data Model

Profile data is stored as a single JSONB column per user:

```json
[
  {
    "id": "uuid-1",
    "title": "Personal Info",
    "fields": [
      { "id": "uuid-2", "label": "Full Name", "value": "Rahul Sharma", "type": "text" },
      { "id": "uuid-3", "label": "Email", "value": "rahul@gmail.com", "type": "email" }
    ]
  },
  {
    "id": "uuid-4",
    "title": "Government IDs",
    "fields": [
      { "id": "uuid-5", "label": "PAN", "value": "ABCDE1234F", "type": "text" }
    ]
  }
]
```

On first login, the app seeds 4 default sections: **Personal Info**, **Government IDs**, **Address**, and **Online Accounts** — all with empty values, ready to fill.

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
