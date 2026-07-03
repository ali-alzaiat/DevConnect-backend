# DevConnect Backend — AI Instructions

## Stack

NestJS 11, Prisma 6 (MySQL), Redis (cache-manager + Keyv), Passport JWT, bcrypt, Winston, Swagger, class-validator, class-transformer.

## Architecture

- **Modular**: each domain feature is a NestJS module (auth, user, article, project, snippet).
- **Common layer**: shared PrismaService, logger, exception filters, interceptors, decorators, DTOs.
- **Standard controllers + services**: controllers handle HTTP, services contain business logic.
- **Prisma**: single source of truth for database schema. Generate client on schema change.
- **Swagger**: all endpoints are decorated for automatic OpenAPI spec generation. The frontend consumes this spec.

## Hard Rules

### API Contract
- Every controller endpoint must have Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, etc.).
- Every DTO must use `class-validator` decorators and `@ApiProperty` decorators.
- The generated OpenAPI spec (`/api-yaml` or `/api-json`) must always be valid — the frontend CI regenerates from it.
- Never change a response shape without updating the DTO and Swagger decorators.

### Modules
- Each module follows: `{name}.module.ts`, `{name}.controller.ts`, `{name}.service.ts`, `dto/`, `entities/`.
- Place shared infrastructure in `common/` (prisma, logger, filters, interceptors, decorators).
- Keep modules loosely coupled — import services through their module exports.

### Database
- Schema changes go in `prisma/schema.prisma`. Run `npx prisma generate` after every change.
- Use Prisma transactions for operations spanning multiple tables.
- Use the versioned cache pattern (incrementing key version on write) for read-heavy endpoints.

### Authentication & Authorization
- JWT auth via `@nestjs/passport` + `passport-jwt`. The `JwtAuthGuard` protects routes.
- Use `@CurrentUser()` custom decorator to extract the authenticated user in controllers.
- Role-based access control where needed (guards in `auth/guard/`).

### Security (OWASP Top 10)
- Input validation: `class-validator` DTOs on every body/query/param.
- Helmet-style headers applied globally (via NestJS middleware or Express).
- Rate limiting on auth endpoints.
- CORS configured to allow only the frontend origin.
- Passwords hashed with bcrypt (10 rounds).
- No secrets in code — all via environment variables and `@nestjs/config`.

### Testing
- Unit test every service (`*.service.spec.ts`) with mocked Prisma/Redis dependencies.
- Integration test every controller (`*.controller.spec.ts`) with `@nestjs/testing` and `supertest`.
- E2E tests in `test/` directory cover critical user journeys.
- Aim for > 80% coverage on services, > 70% overall.

### Logging
- Use the Winston logger from `common/logger/` (daily rotate file + console).
- Log request/response via the global interceptor in `common/interceptors/`.
- Never log sensitive data (passwords, tokens, PII).

### Comments
- Prefer clean naming and strong types to make code self-documenting.
- Use descriptive comments to explain complex logic or non-obvious architectural decisions.
- Use JSDoc for public APIs of shared services if the signature is non-obvious.

## Folder Structure

```
src/
  main.ts                   -- Bootstrap: pipes, CORS, Swagger, logger
  app.module.ts             -- Root module (imports all feature modules)
  auth/                     -- Auth module (login, signup, JWT strategy, guards, decorators)
  user/                     -- User module (CRUD, profile)
  article/                  -- Article module (cache-version pattern)
  project/                  -- Project & Task module (Prisma transactions)
  snippet/                  -- Snippet module (tag relations)
  common/
    prisma/                 -- PrismaService (singleton DB client)
    logger/                 -- Winston configuration
    filters/                -- Global exception filters (PrismaExceptionFilter)
    interceptors/           -- Request logging interceptor
    decorators/             -- Shared decorators
    dto/                    -- Shared DTOs (pagination, etc.)
  types/                    -- Shared TypeScript types/enums
```

## Git

- Conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- `npm run lint` and `npm run format` before every commit.
- Husky + Commitlint enforce commit message format.
