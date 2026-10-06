# API Documentation — Faculty Leave Management System

Base URL: `http://localhost:5000/api`

All protected routes require:
```
Authorization: Bearer <jwt_token>
```

---

## Authentication

### POST /auth/login
**Body:** `{ email, password }`
**Response:** `{ token, user: { id, name, email, role, department } }`

### POST /auth/register
**Body:** `{ employee_id, name, email, password, role?, department_id?, phone?, designation? }`

### GET /auth/me
**Auth required.** Returns current user profile with department.

### PUT /auth/change-password
**Body:** `{ current_password, new_password }`

---

## Faculty Stats

### GET /faculty/dashboard-stats
**Roles:** faculty
Returns leave stats, weekly lectures count, substitution count, upcoming sub duties, recent leaves.

### GET /faculty/profile
**Roles:** faculty, hod
Returns profile with subject mappings.

---

## Leave Requests

### GET /leaves
**Query params:** `status`, `faculty_id` (admin/hod only), `page`, `limit`
**Role-filtered:** Faculty sees own leaves, HOD sees department leaves, Admin sees all.

### GET /leaves/:id
Returns leave detail + reassignment list for that leave.

### POST /leaves
**Roles:** faculty
**Body:**
```json
{
  "leave_type": "sick|casual|earned|maternity|emergency|other",
  "start_date": "2025-03-10",
  "end_date": "2025-03-12",
  "reason": "Medical appointment"
}
```
Validates: no overlapping approved/pending leaves for same faculty.

### PUT /leaves/:id/review
**Roles:** hod, admin
**Body:**
```json
{ "status": "approved|rejected", "hod_remarks": "Reason..." }
```
When **approved**: triggers the rescheduling engine automatically.
**Response includes:** `{ reassignments_created: N, reassignments: [...] }`

### PUT /leaves/:id/cancel
**Roles:** faculty (own pending leaves only)

---

## Timetable

### GET /timetable
**Query params:** `faculty_id`, `department_id`, `day`
**Response:** `{ data: [...], grouped: { Monday: [...], Tuesday: [...], ... } }`

### POST /timetable
**Roles:** admin
**Body:**
```json
{
  "faculty_id": 4,
  "subject_id": 1,
  "department_id": 1,
  "day_of_week": "Monday",
  "start_time": "09:00",
  "end_time": "10:00",
  "room_number": "CS-101",
  "semester": 3
}
```
Validates: no time overlap for same faculty on same day.

### PUT /timetable/:id
**Roles:** admin — same body as POST, validates conflicts excluding current slot.

### DELETE /timetable/:id
**Roles:** admin — soft delete (sets `is_active = 0`).

---

## Lecture Reassignments

### GET /reassignments
**Query params:** `leave_request_id`, `status`, `faculty_id`
**Role-filtered:** Faculty sees own, HOD sees department, Admin sees all.

### GET /reassignments/substitution-duties
**Roles:** faculty — returns all slots where logged-in faculty is the substitute.

### GET /reassignments/available-substitutes/:reassignmentId
**Roles:** hod, admin
Returns faculty who: know the subject AND have no timetable conflict at that time slot.
Each candidate includes `substitution_count`, `is_primary`, `department_name`.

### PUT /reassignments/:id/override
**Roles:** hod, admin
**Body:** `{ substitute_faculty_id, reason? }`
Validates availability, updates workload log, notifies substitute.

---

## Notifications

### GET /notifications
**Query params:** `unread_only=true`, `page`, `limit`
**Response:** `{ data: [...], meta: { total, unread } }`

### PUT /notifications/mark-all-read
Marks all of current user's notifications as read.

### PUT /notifications/:id/read
Marks single notification as read.

### DELETE /notifications/:id
Deletes a notification (own only).

---

## Admin — Users

### GET /admin/faculty
**Roles:** admin, hod
**Query params:** `department_id`, `role`, `search`

### GET /admin/faculty/:id
Returns profile + subjects array.

### POST /admin/faculty
**Roles:** admin
**Body:** `{ employee_id, name, email, password?, role, department_id?, phone?, designation? }`

### PUT /admin/faculty/:id
**Body:** same as POST (no password field — use reset-password endpoint).

### PUT /admin/faculty/:id/reset-password
**Body:** `{ new_password }`

### PUT /admin/faculty/:id/subjects
**Body:** `{ subjects: [{ subject_id, is_primary }] }`
Replaces all subject mappings for this faculty.

---

## Admin — Departments

### GET /admin/departments
Returns all departments with `faculty_count`.

### POST /admin/departments
**Body:** `{ name, code }`

### PUT /admin/departments/:id
**Body:** `{ name, code }`

### DELETE /admin/departments/:id

---

## Admin — Subjects

### GET /admin/subjects
**Query params:** `department_id`

### POST /admin/subjects
**Body:** `{ name, code, department_id?, semester?, credits? }`

### PUT /admin/subjects/:id
**Body:** same as POST.

### DELETE /admin/subjects/:id

---

## Analytics (roles: admin, hod)

### GET /analytics/overview
Returns KPI summary: total leaves, approved, rejected, pending, reassignments, coverage%, faculty count, manual assignments.

### GET /analytics/leave-trends
Returns:
- `monthly`: Last 12 months breakdown (total, approved, rejected per month)
- `byType`: Count per leave type

### GET /analytics/faculty-workload
Returns per-faculty: weekly lecture count, total substitutions, total leaves taken.

### GET /analytics/department-stats
Returns per-department: faculty count, total leaves, approved, pending, reassignments.

### GET /analytics/faculty-leave-counts
Returns per-faculty leave counts (total, approved, rejected, pending).

### GET /analytics/substitution-patterns
Returns:
- `mostSubstituted`: Top faculty by substitution count
- `coverageRate`: Overall % of lectures covered
- `bySubject`: Most reassigned subjects

---

## Rescheduling Engine Logic

Triggered automatically on `PUT /leaves/:id/review` with `status: approved`.

**Algorithm:**
1. Iterate each date in leave period
2. Find day of week → query all active timetable slots for that faculty+day
3. For each slot, query candidates from `faculty_subjects` who know the subject
4. Filter: remove anyone with a conflicting timetable slot OR already assigned to another substitution at same time
5. Score remaining candidates:
   - +40: primary subject expertise
   - +20: secondary subject expertise
   - +30 max: inverse of monthly substitution count (10 - count) × 3
   - +15: same department as original faculty
   - -10: already assigned for another slot of this same leave
6. Assign top scorer, update `workload_logs`, send notifications
7. If no candidate found: create record with `status='pending'` for manual assignment

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400  | Validation error / bad request |
| 401  | Not authenticated / expired token |
| 403  | Insufficient role |
| 404  | Resource not found |
| 409  | Conflict (duplicate, overlapping leave) |
| 500  | Internal server error |

All errors: `{ success: false, message: "..." }`
All success: `{ success: true, data: {...} | [...] }`
