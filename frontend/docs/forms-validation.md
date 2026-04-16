# Forms & Validation (Zod)

## Rules

- All forms must use Zod
- Validation runs before API call

---

## Example: Login

- email: required, email format
- password: min 6 chars

---

## Example: Payment

- amount: > 0
- rentId: required
- method: enum