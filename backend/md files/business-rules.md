# Business Rules

## Rent Rules
- Rent is generated once per month per tenant
- Duplicate rent for same month is NOT allowed
- Rent status transitions:
  PENDING → PARTIAL → PAID
  PENDING → OVERDUE

---

## Payment Rules
- Payment must always reference a rent
- Partial payments allowed
- Overpayment must be rejected
- Payment cannot be edited after creation

---

## Tenant Rules
- Tenant cannot exist without property
- Inactive tenant → no new rent generation

---

## User Rules
- Only ADMIN can create users
- Password must be hashed using bcrypt

---

## Data Integrity
- All foreign keys must be enforced
- Soft delete using isActive