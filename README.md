# 🍕 FoodOrder — Team Food Ordering Application

A full-stack web application for team food ordering with **Role-Based Access Control (RBAC)** and **country-based data isolation**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) |
| Backend | Nest.js (REST API) |
| Database | Supabase (PostgreSQL) |
| Payments | Stripe |
| Auth | JWT (JSON Web Tokens) |

## Users & Roles

| Name | Role | Country |
|------|------|---------|
| Nick Fury | Admin | America |
| Captain Marvel | Manager | India |
| Captain America | Manager | America |
| Thanos | Member | India |
| Thor | Member | India |
| Travis | Member | America |

## Access Control

| Function | Admin | Manager | Member |
|----------|-------|---------|--------|
| View restaurants & menus | ✅ All | ✅ Own country | ✅ Own country |
| Create order | ✅ All | ✅ Own country | ✅ Own country |
| Place order (checkout) | ✅ | ✅ | ❌ |
| Cancel order | ✅ | ✅ | ❌ |
| Update payment method | ✅ | ❌ | ❌ |

## Prerequisites

- Node.js 18+
- npm
- Supabase account (with project created)
- Stripe account (test mode)

## Setup Instructions

### 1. Clone & Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set up Environment Variables

Create a `.env` file in the **project root** (`Food Ordering web-app/.env`):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable
JWT_SECRET=your-random-secret-string
```

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable
```

### 3. Set up Database

1. Go to your Supabase dashboard → SQL Editor
2. Copy the contents of `supabase_schema.sql`
3. Run the SQL — this creates all tables and inserts seed data

### 4. Run the Application

```bash
# Terminal 1: Start the backend (port 3001)
cd backend
npm run start:dev

# Terminal 2: Start the frontend (port 3000)
cd frontend
npm run dev
```

### 5. Open the Application

Navigate to **http://localhost:3000** and select a user to login.

## Project Structure

```
Food Ordering web-app/
├── backend/                    # Nest.js API
│   └── src/
│       ├── auth/               # Login, JWT, guards
│       ├── guards/             # RBAC guards & decorators
│       ├── orders/             # Order CRUD + checkout
│       ├── payments/           # Stripe integration
│       ├── restaurants/        # Restaurant & menu queries
│       ├── supabase/           # DB client
│       └── main.ts             # App entry (port 3001)
├── frontend/                   # Next.js app
│   └── src/
│       ├── app/                # Pages (App Router)
│       ├── components/         # Shared UI components
│       └── contexts/           # Auth & Cart contexts
├── supabase_schema.sql         # Database schema + seed data
├── ARCHITECTURE.md             # Design documentation
├── api_collection.json         # API endpoint collection
└── README.md                   # This file
```

## API Endpoints

See `api_collection.json` for detailed endpoint documentation.

| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| POST | `/auth/login` | No | All |
| GET | `/auth/users` | No | All |
| GET | `/restaurants` | JWT | All |
| GET | `/restaurants/:id` | JWT | All |
| GET | `/restaurants/:id/menu` | JWT | All |
| POST | `/orders` | JWT | All |
| GET | `/orders` | JWT | All |
| POST | `/orders/:id/cancel` | JWT | Admin, Manager |
| POST | `/orders/:id/checkout` | JWT | Admin, Manager |
| GET | `/payments/methods` | JWT | Admin |
| POST | `/payments/methods` | JWT | Admin |
| DELETE | `/payments/methods/:id` | JWT | Admin |
| PUT | `/payments/methods/:id/default` | JWT | Admin |
| POST | `/payments/create-payment-intent` | JWT | Admin, Manager |
