# API Integration

## Axios Setup

- Base URL from env
- Attach JWT in headers:
  Authorization: Bearer <token>

---

## Error Handling

- 401 → logout user
- 500 → show toast

---

## Data Fetching Strategy

- Server components → for initial data
- Client components → for actions (forms)