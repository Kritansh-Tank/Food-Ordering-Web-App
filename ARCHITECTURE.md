# Architecture & Design Document

## System Architecture

The application follows a **client-server architecture** with a clear separation between the frontend (Next.js) and backend (Nest.js).

```
┌─────────────────────┐     HTTP/REST      ┌─────────────────────┐
│   Next.js Frontend  │ ◄──────────────── │  Nest.js Backend    │
│   (Port 3000)       │   Bearer JWT Auth  │  (Port 3001)        │
└─────────────────────┘                    └──────────┬──────────┘
                                                      │
                                           ┌──────────┴──────────┐
                                           │                     │
                                    ┌──────┴──────┐    ┌─────────┴────────┐
                                    │  Supabase   │    │   Stripe API     │
                                    │  (Postgres) │    │   (Payments)     │
                                    └─────────────┘    └──────────────────┘
```

## Database Schema

### Entity Relationship

- **users** → has many **orders**, has many **payment_methods**
- **restaurants** → has many **menu_items**, has many **orders**
- **orders** → has many **order_items**
- **order_items** → belongs to **menu_items**

### Country-Based Isolation

Data is partitioned by `country` field on `restaurants` and `orders` tables. The backend filters queries based on the authenticated user's country (from JWT payload). Admin users bypass country filters.

## RBAC Implementation

### Server-Side Enforcement

1. **JwtAuthGuard** — Validates JWT token on every protected endpoint
2. **RolesGuard** — Checks user's role against endpoint requirements using `@Roles()` decorator
3. **Service-level checks** — Each service method additionally validates country access

### Flow

```
Request → JwtAuthGuard → RolesGuard → Controller → Service (country check) → Supabase
```

### Role Permissions

| Role | View | Create Order | Checkout | Cancel | Payment Methods |
|------|------|-------------|----------|--------|----------------|
| Admin | All countries | All countries | ✅ | ✅ | ✅ |
| Manager | Own country | Own country | ✅ | Own country | ❌ |
| Member | Own country | Own country | ❌ | ❌ | ❌ |

## Authentication Flow

1. User selects a profile on the login screen
2. Frontend sends `POST /auth/login` with the user ID
3. Backend looks up user in Supabase, generates JWT with: `sub`, `name`, `role`, `country`
4. Frontend stores JWT in localStorage and attaches it as `Authorization: Bearer <token>` on all API requests
5. Backend validates JWT on every request through `JwtAuthGuard`

## Stripe Integration

- **Payment Methods**: Admin can add/remove/set-default payment methods via Stripe API
- **Checkout**: Creates a Stripe PaymentIntent with the order total and attaches the default payment method
- **Customer Management**: Each user gets a Stripe Customer ID on first interaction

## Frontend Architecture

- **App Router**: Next.js 15 with client-side routing
- **AuthContext**: Manages JWT, user state, and provides `apiFetch()` helper
- **CartContext**: Client-side cart state with restaurant scoping
- **Role-based UI**: Components conditionally render features based on user role
