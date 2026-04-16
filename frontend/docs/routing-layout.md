# Routing & Layout

## Routes Structure (App Router)

/login
/dashboard
/users
/properties
/tenants
/payments

---

## Layouts

### Public Layout
- Used for login page
- No sidebar

### Dashboard Layout
- Sidebar (navigation)
- Top navbar
- Content area

---

## Sidebar Navigation

- Dashboard
- Users (ADMIN only)
- Properties
- Tenants
- Payments

---

## Access Control

- Unauthorized users → redirect to /login
- Role-based route protection