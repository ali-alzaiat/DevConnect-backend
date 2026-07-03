---
name: security-review
description: Pre-merge security checklist for backend changes
license: MIT
compatibility: opencode
metadata:
  repo: DevConnect-backend
  type: checklist
---

## What I do

Provide a comprehensive security review checklist aligned with OWASP Top 10 for backend pull requests.

## When to use me

Use this skill before merging any PR that modifies authentication, authorization, data handling, or adds new endpoints.

## Checklist

### Authentication
- [ ] Are new endpoints protected with the appropriate guard?
- [ ] Is `@ApiBearerAuth()` added for auth-protected endpoints?
- [ ] Are JWTs validated correctly (expiration, signature)?

### Authorization
- [ ] Are user IDs from the token used (via `@CurrentUser()`) instead of request body?
- [ ] Are role checks in place for admin-only operations?

### Input Validation
- [ ] Does every body/query/param have a matching DTO?
- [ ] Are all DTO fields validated with class-validator?
- [ ] Is `whitelist: true` preventing unknown properties?

### Data Exposure
- [ ] Are passwords/tokens never returned in responses?
- [ ] Are error messages sanitized (no stack traces leaked)?
- [ ] Does `PrismaExceptionFilter` handle all Prisma errors?

### Configuration
- [ ] Are secrets loaded from env (not hardcoded)?
- [ ] Is CORS restricted to the frontend origin?
- [ ] Are rate limits configured for auth endpoints?

## Quick Test

```bash
# Attempt to access protected route without token
curl -s http://localhost:3000/v1/projects | grep -q "Unauthorized"

# Attempt to send extra fields
curl -s -X POST http://localhost:3000/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123","extraField":"hack"}' | \
  grep -q "property extraField should not exist"
```