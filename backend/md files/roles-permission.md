# Roles & Permissions (RBAC)

## ADMIN
Capabilities:
- Full CRUD on Users, Properties, Tenants
- View all financial data
- Assign Managers/Collectors

Restrictions:
- Cannot delete system-critical records (only deactivate)

---

## MANAGER
Capabilities:
- Manage assigned properties
- View tenants & payments under those properties
- View reports

Restrictions:
- Cannot create users
- Cannot modify payments

---

## COLLECTOR
Capabilities:
- Record payments
- View assigned tenants

Restrictions:
- Cannot edit/delete payments
- Cannot access reports

---

## Authorization Rules

- All endpoints must validate JWT
- Role must be checked via middleware
- Ownership checks required for property-level access