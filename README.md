# dentalprimeweb3

Modern Dental Clinic Management System & Patient Booking Portal with integrated CRM, Cloud Neon PostgreSQL, Express API backend, and responsive Vite/React interface.

## ✨ Features

- **Clinic Patient Portal & Online Booking**: Clean in-page appointment scheduling flow with interactive date & time selection.
- **Receptionist & Staff CRM**:
  - Live Walk-In token queue issuance (`A001`, `A002`, etc.).
  - Appointment scheduling & calendar management.
  - Doctor Consultation Workspace with clinical notes and prescriptions.
  - Payment & Billing Desk with invoice generation and receipt printing.
  - Multi-status patient tracking (Scheduled, Arrived, In Consultation, Awaiting Bill, Completed).
- **Database Support**:
  - Cloud PostgreSQL via **Neon DB** with connection pooling and schema migrations.
  - Fail-safe fallback persistence (`data/crm_store.json`).
- **Responsive & Modern Design**:
  - Professional dental clinic branding and design system.
  - Dark mode and light mode support.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 6, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend**: Express.js, Node.js
- **Database**: Neon PostgreSQL (`pg`), connection pooler
- **Authentication**: JWT & bcryptjs password hashing

## 🚀 Getting Started

### 1. Installation

```bash
git clone https://github.com/kivexdental/dentalprimeweb3.git
cd dentalprimeweb3
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your database credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5173
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@your-neon-host.neon.tech/neondb?sslmode=require
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

### 3. Run Development Server

```bash
npm run dev
```

Open your browser at `http://localhost:5173`:
- **Website**: `http://localhost:5173/`
- **CRM Dashboard**: `http://localhost:5173/dashboard`
- **Staff Login**: `http://localhost:5173/login` (Default admin: `admin` / `admin123`)

## 📜 License

MIT License. Designed and developed for Dental Clinic Management.
