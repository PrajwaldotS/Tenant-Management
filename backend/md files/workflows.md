# Workflows

## Rent Generation (Scheduled Job)

Trigger: Monthly cron

Steps:
1. Fetch all active tenants
2. Check if rent already exists for month
3. If not → create rent
4. Set status = PENDING

---

## Payment Processing Flow

1. Collector selects tenant
2. System fetches active rent
3. Validate:
   - rent exists
   - amount <= remaining
4. Create payment
5. Update rent:
   - remaining = rent.amount - sum(payments)
   - update status accordingly

---

## Login Flow

1. Validate credentials
2. Compare hashed password
3. Generate JWT
4. Return token