# System Overview

This system is a production-grade Property & Tenant Management platform designed for single-city deployment with potential scalability.

## Objectives
- Manage rental properties efficiently
- Track tenant lifecycle and rent payments
- Provide role-based operational control
- Ensure financial accuracy and auditability

## Core Domains
- Identity & Access Management
- Property & Tenant Management
- Rent Lifecycle Management
- Payment Processing
- Reporting & Audit

## Tech Stack
- Node.js (TypeScript)
- Express.js
- Prisma ORM
- PostgreSQL
- Zod (schema validation)
- JWT (authentication)

## Architectural Principles
- Separation of concerns (Controller → Service → Repository)
- Stateless backend (JWT-based auth)
- Idempotent APIs where applicable
- Soft deletion over hard deletion
- Audit-first design (every critical action traceable)

## Non-Goals (for MVP)
- Multi-city multi-tenant SaaS
- Payment gateway integration