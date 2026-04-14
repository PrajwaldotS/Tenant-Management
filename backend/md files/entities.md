# Entities (Detailed Design)

## User
Purpose: Represents system actors

Fields:
- id: UUID (PK)
- name: string
- email: string (unique, indexed)
- password: string (hashed, never returned)
- role: enum (ADMIN, MANAGER, COLLECTOR)
- isActive: boolean (default: true)
- lastLoginAt: datetime (nullable)
- createdAt
- updatedAt

Constraints:
- email must be unique
- inactive users cannot authenticate

Indexes:
- email index

---

## Property
Purpose: Represents a rental property

Fields:
- id: UUID (PK)
- name: string
- address: string
- ownerId: UUID (FK → User)
- isActive: boolean
- createdAt

Constraints:
- owner must be ADMIN

---

## Tenant
Purpose: Represents a tenant renting a property

Fields:
- id: UUID (PK)
- name: string
- phone: string
- propertyId: UUID (FK)
- moveInDate: date
- isActive: boolean
- createdAt

Constraints:
- must belong to exactly one property

---

## Rent
Purpose: Represents monthly rent obligation

Fields:
- id: UUID (PK)
- tenantId: UUID (FK)
- amount: decimal
- dueDate: date
- status: enum (PENDING, PARTIAL, PAID, OVERDUE)
- generatedMonth: string (YYYY-MM)
- createdAt

Derived Logic:
- OVERDUE if currentDate > dueDate AND status != PAID

---

## Payment
Purpose: Represents payment transactions

Fields:
- id: UUID (PK)
- tenantId: UUID (FK)
- rentId: UUID (FK)
- amount: decimal
- paymentDate: datetime
- method: enum (CASH, UPI, BANK)
- referenceId: string (optional)
- createdBy: UUID (FK → User)
- createdAt

Constraints:
- amount > 0
- total payments ≤ rent.amount