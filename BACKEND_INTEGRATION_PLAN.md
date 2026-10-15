# Backend and Database Integration Plan

Project: A Web-Based Patient Queue, Information Display, and Health Information Management System with Data Analytics for Barangay Longos Super Health Center, Malabon City.

## Current frontend inspection

The project is plain HTML, CSS, and JavaScript. The entry point is `index.html`; interface rendering and event handling live in `js/app.js`; demonstration collections live in `js/data.js`; styling is in `css/style.css`; images and logos are under `assets/`.

The current interface includes patient dashboard/profile/records, staff registration/patient/queue/initial-health/information pages, doctor patient/consultation/queue pages, administrator user/provider/information/settings pages, and a public display. Current values are read from the in-memory `window.LONGOS_DATA` object. Form actions mostly update demo state and must be reviewed before connecting persistent storage. The current UI does not include analytics charts.

## Recommended architecture (proposal, validate before implementation)

- Frontend: retain the existing HTML/CSS/vanilla JavaScript.
- Backend: Node.js LTS with Express. It aligns with the current JavaScript skill set and can expose a small REST API without replacing the frontend.
- Database: PostgreSQL, using foreign keys, constraints, transactions, and indexed relational queries.
- Data access: use a maintained PostgreSQL client or query builder, parameterized SQL, and versioned migrations. Keep database credentials in server-side environment variables, never in frontend files.
- Flow: browser UI -> HTTPS JSON API -> authentication/authorization middleware -> service/validation layer -> PostgreSQL. The browser never connects directly to the database.

## Initial relational schema (draft, subject to requirements review)

- `users`: id, username (unique), password_hash, role, staff/doctor profile reference, active, created_at, updated_at.
- `families`: id, family_record_number (unique), address, created_at, updated_at.
- `patients`: id, family_id (FK), patient_code (unique), full_name, nickname, birth_date, sex, contact details where needed, active, created_at, updated_at.
- `queue_entries`: id, queue_number, patient_id (FK), service_id (FK), queue_date, status, created_by (FK users), called_at, completed_at. Enforce sensible status transitions and unique queue numbers per queue date.
- `services`: id, name, description, active.
- `service_schedules`: id, service_id (FK), day/date rules, start_time, end_time, notes, active.
- `facility_information`: id, category, title, public_description, location/details, display_order, active, updated_by (FK users), updated_at. Store only information appropriate for public display.
- `clinical_records`: id, patient_id (FK), encounter_date, doctor_user_id (FK), assessment/diagnosis, treatment/prescription, notes, created_at, updated_at. Restrict reads and writes to authorized clinical workflows.
- `initial_assessments`: id, patient_id (FK), recorded_by (FK users), recorded_at, vital fields actually required by the health center, notes. Confirm the approved scope before finalizing fields.
- `audit_logs`: id, actor_user_id (FK), action, resource_type, resource_id, timestamp, minimal metadata. Avoid storing passwords, tokens, or unnecessary health data in logs.

Use internal IDs as primary keys; family record numbers and patient codes are business identifiers, not database primary keys. Apply timestamps consistently and define retention/access policies with the health center. Do not use real patient data in development.

## Proposed API outline

Authentication:
- `POST /api/auth/login` — verify credentials server-side; return a secure session cookie and minimal account/role information.
- `POST /api/auth/logout` — invalidate the session.
- `GET /api/auth/me` — return the current authenticated user and role from the server session.

Patients and families:
- `GET /api/patients?search=&familyRecordNumber=`
- `POST /api/patients`
- `GET /api/patients/:id`
- `PATCH /api/patients/:id`
- `GET /api/families/:id/patients`

Queue:
- `GET /api/queue?date=&status=`
- `POST /api/queue`
- `PATCH /api/queue/:id/status`
- `GET /api/public/queue` — deliberately limited response with queue number, nickname, and status only.

Clinical records:
- `GET /api/patients/:id/clinical-records`
- `POST /api/patients/:id/clinical-records`
- `PATCH /api/clinical-records/:id`

Public information:
- `GET /api/public/services`
- `GET /api/public/facility-information`
- `GET /api/admin/schedules`
- `POST /api/admin/schedules`
- `PATCH /api/admin/schedules/:id`

Analytics:
- `GET /api/analytics/admin/overview?from=&to=`
- `GET /api/analytics/doctor/overview?from=&to=`

User management:
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`

Every endpoint must validate inputs and enforce permissions on the server. These are proposed routes, not implemented endpoints.

## Role and privacy controls

- Roles should be assigned by a trusted administrator when accounts are created. Login must identify the role from the verified server-side account record; never accept a role from a form, query string, local storage, or request body as authority.
- Admin/Staff: manage registration, family links, queue, schedules, and approved public information. Access to clinical details should be limited to the minimum explicitly approved by the health center.
- Doctor: view consultation queue, access records needed for care, and create/update clinical records. No user administration or unrestricted schedule/system administration by default.
- Public display: expose only nickname, queue number, status, approved schedules, facility directions, and other explicitly public information. Never return full names, contact details, family record numbers, diagnoses, or prescriptions.
- Hash passwords with Argon2id (or a suitably configured bcrypt implementation); use HTTPS, secure HttpOnly SameSite cookies, session expiration and invalidation, CSRF protection where applicable, login throttling, generic authentication errors, and server-side authorization checks.
- Validate and normalize all input, use parameterized database queries, encode output, set security headers, restrict CORS, and keep secrets outside source control.
- Log security-relevant actions with minimal data; establish backup encryption, restore testing, access reviews, and retention procedures. Confirm applicable Philippine Data Privacy Act and health-record handling obligations with the institution.

## Analytics

Admin/Staff dashboard: daily queue volume, waiting/completed counts, average wait time, service demand, and schedule utilization where the data supports it.

Doctor dashboard: consultation volume, queue/wait trends, visit counts over time, and service/encounter summaries relevant to clinical operations. Avoid unnecessary patient-identifying data; aggregate by default and apply access controls.

Metrics must be calculated from persisted database records and documented definitions, date ranges, time zone, and handling of cancelled/no-show entries. Do not treat the current sample data as real analytics.

## Implementation sequence

1. Confirm scope, role permissions, required fields, public-display rules, and the meaning of the existing pages with the health center/adviser.
2. Add backend project structure and environment configuration; create a health-check endpoint.
3. Add PostgreSQL migrations, constraints, seed only synthetic demo data, and automated migration tests.
4. Implement authentication/session handling and server-side role authorization before exposing patient data.
5. Add patient/family endpoints and connect one frontend workflow at a time through a small API module.
6. Add queue endpoints and test concurrent queue-number creation and status transitions.
7. Add schedules/facility information and the privacy-limited public display endpoint.
8. Add clinical record/assessment endpoints with strict doctor permissions and audit events.
9. Add analytics queries and role-specific dashboard components only after data definitions are agreed.
10. Test validation, permissions, session expiry, CSRF, XSS, SQL injection resistance, public response redaction, backups/restores, and responsive UI behavior.
11. Deploy behind HTTPS with managed database access, monitoring, backups, and a documented recovery plan.

## Current limitations

This plan is not a deployed backend or finalized database schema. The existing UI currently uses in-memory sample collections in `js/data.js`; refreshing the page resets frontend changes. Authentication is not connected. The current code does not include a real analytics chart implementation. Review each form handler and access path during integration, and do not use real patient records for testing.
