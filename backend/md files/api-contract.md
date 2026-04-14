# API Standards

## Common Rules
- All responses must follow:

{
  success: boolean,
  data?: any,
  message?: string
}

---

## Pagination
Query:
?page=1&limit=10

Response:
{
  data: [],
  meta: {
    page,
    limit,
    total
  }
}

---

## Filters
- ?status=PAID
- ?propertyId=xxx

---

## Sorting
- ?sort=createdAt_desc