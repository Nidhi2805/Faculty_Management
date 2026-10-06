# Faculty Leave Management & Dynamic Lecture Rescheduling

A full-stack web application for managing faculty leave requests and automatically rescheduling affected lectures. Built as a final-year project using React, Node.js, Express, and MySQL.

---

## What it does

Faculty can apply for leave online. When a HOD approves the request, the system looks at that faculty member's timetable, finds available substitute faculty who can teach the same subject, and assigns them — avoiding scheduling conflicts and distributing the load fairly.

**Three roles:**
- **Faculty** — apply for leave, view timetable, see substitution duties assigned to them
- **HOD** — approve or reject leave requests, view and override auto-generated reassignments
- **Admin** — manage all users, departments, subjects, and timetable entries

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, React Router, Recharts |
| Backend | Node.js, Express.js |
| Database | MySQL 8 |
| Auth | JWT + bcryptjs |
| HTTP Client | Axios |
| Styling | Custom CSS (no UI framework) |

---

## Getting Started

### Requirements
- Node.js 16+
- MySQL 8
- npm

### 1. Database setup

```bash
mysql -u root -p -e "CREATE DATABASE faculty_leave_mgmt;"
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Open .env and set DB_PASSWORD if your MySQL has one
npm install
npm run dev
```

The server starts on `http://localhost:5000`. On first run it creates all tables and inserts demo data automatically.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

App opens on `http://localhost:3000`.

---

## Demo Accounts

All accounts use password: **Password@123**

| Role | Email |
|------|-------|
| Admin | admin@college.edu |
| HOD (CS Dept) | hod.cs@college.edu |
| HOD (IT Dept) | hod.it@college.edu |
| Faculty | amit.sharma@college.edu |
| Faculty | priya.patel@college.edu |
| Faculty | rahul.gupta@college.edu |
| Faculty | neha.singh@college.edu |
| Faculty | suresh.nair@college.edu |

---

## How the Rescheduling Works

When a leave is approved, the backend:

1. Finds all timetable slots for the absent faculty during the leave dates
2. For each slot, queries faculty who know that subject (`faculty_subjects` table)
3. Filters out anyone with a conflicting class at the same time
4. Scores remaining candidates:
   - Primary subject expertise: +40 points
   - Secondary subject expertise: +20 points
   - Lower monthly substitution count: up to +30 points
   - Same department: +15 points
   - Already assigned for another slot in this leave: −10 points
5. Assigns the top scorer, updates their workload log, and sends notifications

If no suitable substitute is found, the slot is flagged as unassigned for manual HOD assignment.

---

## Project Structure

```
faculty-leave-mgmt/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection, schema init, seed data
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Rescheduling engine, notifications
│   │   ├── middleware/     # JWT auth, validation, error handling
│   │   ├── routes/         # Express route definitions
│   │   └── server.js
│   └── .env.example
├── frontend/
│   └── src/
│       ├── components/     # Layout, Sidebar
│       ├── context/        # Auth state (JWT)
│       ├── pages/          # All page components
│       └── services/       # Axios API client
├── API_DOCS.md
└── README.md
```

---

## Known Limitations

- No email notifications — notifications are in-app only
- No file upload for leave documents
- Timetable is fixed per academic year; mid-year changes require manual admin edits
- The analytics charts show historical seed data; live data will grow as the app is used
- No pagination on the timetable view for large datasets
- No mobile-specific layout (works on tablet and desktop)
- Password reset is admin-only; no "forgot password" email flow

---

## Possible Improvements

- Email notifications on leave approval/rejection using Nodemailer
- Calendar view for timetable instead of day tabs
- Export leave records to CSV or PDF
- Department-wise leave balance tracking per faculty
- Mobile-responsive redesign
- Admin bulk-import faculty via CSV

---

## API Reference

See [API_DOCS.md](./API_DOCS.md) for the full endpoint list with request/response examples.

---

## Database

11 tables: `users`, `departments`, `subjects`, `faculty_subjects`, `timetable`, `leave_requests`, `lecture_reassignments`, `notifications`, `workload_logs`

Schema is auto-created on first server start. Demo seed data includes 10 users, 24 timetable slots, 14 historical leave records, and 10 reassignment records.

---

## Screenshots

> Screenshots taken from a locally running instance with demo seed data.

### Login Page
![Login](screenshots/login.png)

### Faculty Dashboard
![Faculty Dashboard](screenshots/faculty-dashboard.png)

### HOD Leave Approval
![HOD Leave Approval](screenshots/hod-review-modal.png)

### Lecture Reassignments (Auto-assigned)
![Reassignments](screenshots/reassignments.png)

### Analytics Dashboard
![Analytics](screenshots/analytics.png)
