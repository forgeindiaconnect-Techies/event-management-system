# FIC BackRooms Event Management System

FIC BackRooms is a multi-tenant event management platform for creating portals, organizing events, managing registrations, assigning event teams, running event-day operations, and reviewing event reports.

## Main Features

- Portal creation and subscription management
- Portal Admin and Organizer dashboards
- Event creation, publishing, cancellation, and lifecycle tracking
- Event banner validation with a branded fallback image
- Registration forms, ticket classes, payments, waitlists, and approvals
- QR ticket generation and event check-in
- Attendance and certificate management
- Organizer, staff, coordinator, volunteer, speaker, chief guest, judge, and mentor roles
- Agenda scheduling with Morning, Noon, Evening, and Night Session sections
- Exhibitors, booths, leads, and exhibitor reports
- Abstract topics and submission forms
- Event operations, including tasks, incidents, resources, vendors, and budgets
- Revenue, attendance, registration, and payment reports
- Persistent in-session FIC AI assistant
- Feedback and support-request tracking
- Database-backed email announcements for registered attendees
- Queued email delivery with retries and scheduled delivery

## Technology Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Bootstrap
- Recharts
- QR code and PDF libraries

### Backend

- Java 17+
- Spring Boot
- Spring Security and JWT authentication
- Spring Data JPA
- MySQL
- Spring Mail
- Maven

### AI Assistant

- FastAPI
- Hugging Face Transformers
- PyTorch
- PEFT adapter model

## Project Structure

```text
EventManagementSystem2/
├── frontend/                         React frontend
├── event_management_system/
│   └── event_management_system/      Spring Boot backend
├── fic-chatbot-api/                  FastAPI AI assistant
└── README.md
```

## Prerequisites

- Node.js 20 or newer
- npm
- Java 17 or newer
- MySQL 8
- Python 3.10 or newer, if running the AI assistant

## Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8081/api
VITE_SUPPORT_EMAIL=support@example.com
VITE_SUPPORT_PHONE=+910000000000
VITE_SUPPORT_WHATSAPP=910000000000
```

Production build:

```powershell
npm run build
```

## Backend Setup

```powershell
cd event_management_system/event_management_system
.\mvnw.cmd spring-boot:run
```

Configure the following environment variables before starting the backend:

```env
AIVEN_DB_URL=jdbc:mysql://HOST:PORT/DATABASE?sslMode=REQUIRED
AIVEN_DB_USERNAME=database_username
AIVEN_DB_PASSWORD=database_password

FRONTEND_URL=http://localhost:5173
CHATBOT_API_URL=http://localhost:8000

SPRING_MAIL_HOST=smtp-relay.brevo.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=brevo_smtp_username
SPRING_MAIL_PASSWORD=brevo_smtp_key
SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true

EMAIL_QUEUE_DELAY_MS=30000
```

Do not commit real database passwords, SMTP keys, API keys, super-admin credentials, or personal contact information.

## AI Assistant Setup

The first model startup can require a large download and may be slow without a GPU.

```powershell
cd fic-chatbot-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

Health check:

```text
GET http://localhost:8000/health
```

## Email Announcements

Event announcements support three audiences:

- `ALL_ATTENDEES`
- `CHECKED_IN_ONLY`
- `PENDING_CHECK_IN`

Announcement statuses:

- `DRAFT`: stored without sending
- `PUBLISHED`: immediately added to the email queue
- `SCHEDULED`: added to the queue for a future date and time

The email worker processes pending messages and retries failed deliveries. The announcement page displays the real recipient and sent counts. Standard email does not provide a reliable read count, so the application does not display a simulated read metric.

## Render Backend Configuration

Recommended Render environment variables:

```env
SERVER_PORT=10000
AIVEN_DB_URL=your_database_jdbc_url
AIVEN_DB_USERNAME=your_database_username
AIVEN_DB_PASSWORD=your_database_password
SPRING_JPA_HIBERNATE_DDL_AUTO=update

FRONTEND_URL=https://your-frontend-domain.example
CHATBOT_API_URL=https://your-chatbot-service.example

SPRING_MAIL_HOST=smtp-relay.brevo.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your_brevo_smtp_username
SPRING_MAIL_PASSWORD=your_brevo_smtp_key
SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true
EMAIL_QUEUE_DELAY_MS=30000
```

Use `SPRING_JPA_HIBERNATE_DDL_AUTO=update` when deploying schema changes such as the `event_announcements` table. Review the migration strategy before switching to `validate` in production.

## Vercel Frontend Configuration

Configure:

```env
VITE_API_BASE_URL=https://your-render-backend.example/api
VITE_SUPPORT_EMAIL=your_office_support_email
VITE_SUPPORT_PHONE=your_office_support_phone
VITE_SUPPORT_WHATSAPP=your_office_whatsapp_number
```

Redeploy the frontend after changing any `VITE_` variable because Vite embeds these values during the build.

## Important Implementation Notes

- Event reports use live backend registration, attendance, certificate, and payment counts.
- Certificate totals currently follow attended registrations when certificates are enabled.
- Engagement polls, Q&A, and feedback are currently frontend-only placeholders. They require public attendee pages and backend APIs before production use.
- Email announcements are backend-persisted and use the existing email-delivery queue.
- AI assistant messages remain available during the current browser session and are cleared on logout or when the browser session ends.

## Security

- Never store credentials in source code or commit `.env` files.
- Use Render, Vercel, or local environment variables for secrets.
- Rotate any credential that has previously been committed.
- Use a Gmail App Password or Brevo SMTP key rather than an account password.
- Restrict production database access and use TLS.

## Git Remotes

The local repository may contain separate personal and office remotes. Confirm them before pushing:

```powershell
git remote -v
```

Push the current `main` branch to the office repository:

```powershell
git push origin main
```

## License

This project is intended for FIC BackRooms organizational use. Add the appropriate license before distributing it publicly.
