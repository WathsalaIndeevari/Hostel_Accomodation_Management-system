# Hostel Accommodation Management System

A full-stack web platform for managing university hostel accommodation — applications, room and bed allocation, payments, and maintenance complaints — built for students, wardens/admins, and maintenance staff.

Built as a group project

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose) |
| Authentication | JWT + bcrypt |
| File storage | Cloudinary (Phase 2) |
| API testing | Postman |
| Version control | Git + GitHub |
| Design | Figma |
| Deployment | Vercel (frontend) · Render/Railway (backend) · MongoDB Atlas (database) |

---

## Actors & Core Features

**Student**
Register/login · manage profile · browse hostels & rooms · apply for accommodation · track application · view allocation · view/upload payments · submit & track complaints · view announcements

**Warden / Admin**
Manage students, hostels, rooms · review & approve/reject applications · allocate rooms · verify payments · manage & assign complaints · publish announcements · view dashboard/reports

**Maintenance Staff**
View assigned requests · update status · add resolution details · mark as completed

---

## Project Structure

```
Hostel-Accommodation-Management-System/
├── client/          # React + Vite + Tailwind frontend
├── backend/          # Node.js + Express + MongoDB backend
├── docs/            # SRS, UML diagrams, ER diagram, wireframes, reports
└── README.md
```

See `client/README.md` and `server/README.md` for module-specific setup notes once the backend is added.

---

## Getting Started

### Prerequisites
- Node.js v18+ and npm
- A MongoDB Atlas connection string (or local MongoDB)
- Git

### Clone the repository

```bash
git clone https://github.com/<org-or-username>/<repo-name>.git
cd Hostel-Accommodation-Management-System
```

### Frontend setup

```bash
cd client
npm install
cp .env.example .env      # set VITE_API_BASE_URL once the backend is running
npm run dev
```

Runs at `http://localhost:5173`. The frontend works against mock data out of the box, so it's usable before the backend is ready — see `client/README.md`.

### Backend setup

```bash
cd server
npm install
cp .env.example .env      # set MONGODB_URI, JWT_SECRET, PORT
npm start
```

Runs at `http://localhost:5000` by default. API routes are prefixed with `/api`.

---

## API Contract (summary)

Full request/response shapes are documented in `client/README.md`. Route list:

```
POST   /api/auth/register
POST   /api/auth/login

GET    /api/hostels            POST /api/hostels
PUT    /api/hostels/:id        DELETE /api/hostels/:id

GET    /api/rooms              POST /api/rooms
PUT    /api/rooms/:id

POST   /api/applications
GET    /api/applications/my
GET    /api/applications
PUT    /api/applications/:id/status

POST   /api/allocations
GET    /api/allocations/my

POST   /api/payments
GET    /api/payments/my
PUT    /api/payments/:id/verify

POST   /api/complaints
GET    /api/complaints/my
PUT    /api/complaints/:id/status

POST   /api/announcements
GET    /api/announcements
```

---

## Branching & Workflow

- `main` — stable, always-deployable branch.
- Personal/feature branches — one per member per feature (e.g. `wathsala`, `feature/payments`, `feature/admin-dashboard`).
- Open a Pull Request into `main` when a feature is ready; at least one other team member reviews before merging.
- Keep commits small and message them clearly, e.g. `feat: add room allocation logic`, `fix: prevent duplicate applications`.

---

## Roadmap

| Phase | Focus |
|---|---|
| 1 | Planning & design (SRS, UML, ER diagram, wireframes) |
| 2 | Project setup (frontend/backend scaffolding) |
| 3 | Authentication (JWT, role-based routes) |
| 4 | Hostel & room management |
| 5 | Accommodation application workflow |
| 6 | Room/bed allocation logic |
| 7 | Payments & receipt verification |
| 8 | Complaints & maintenance workflow |
| 9 | Dashboards & reports |
| 10 | Testing |
| 11 | Deployment |
| 12 | Documentation & presentation |

---

## License

This project is developed for academic purposes as part of a university group assignment.
