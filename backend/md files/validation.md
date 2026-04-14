# Validation Strategy (Zod)

Rules:
- Every request must have a Zod schema
- Validation must happen in middleware
- No controller should receive unvalidated data

---

## Example Schemas

Login:
- email: z.string().email()
- password: z.string().min(6)

Payment:
- amount: z.number().positive()
- rentId: z.string().uuid()
- method: z.enum(["CASH","UPI","BANK"])

Tenant:
- name: z.string().min(2)
- phone: z.string().length(10)