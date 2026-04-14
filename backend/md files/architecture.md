# Architecture

## Layers

Controller:
- Handles HTTP

Service:
- Business logic

Repository (Prisma):
- DB queries

---

## Rules
- No DB calls in controllers
- No validation in services
- No business logic in routes