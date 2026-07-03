# Security Rules (OWASP Top 10)

## Authentication

- JWT via `@nestjs/passport` + `passport-jwt`. Token signed with `JWT_SECRET` from env.
- Passwords hashed with bcrypt (10 salt rounds).
- Login endpoint rate-limited (via middleware or guard).
- Tokens expire after configurable TTL (default 24h).

## Authorization

- Use `JwtAuthGuard` for protected routes.
- Use role-based guards for admin-only features.
- Use `@CurrentUser()` decorator to get the authenticated user — never trust client-supplied user IDs in request bodies.

## Input Validation

- Every body/query/param must be validated via `class-validator` DTOs.
- Use `ValidationPipe` globally with `whitelist: true` and `forbidNonWhitelisted: true`.
- Never use `any` for request inputs — always define a DTO.

## Data Protection

- No secrets in code. Use `@nestjs/config` and `.env` files.
- `.env` is in `.gitignore`.
- Never log passwords, tokens, or PII.
- CORS configured to allow only the frontend origin (set via `FRONTEND_URL` env var).

## Headers & Transport

- Helmet-style headers applied globally.
- Rate limiting on all routes (different limits per endpoint type).
- HTTPS in production (enforced at the reverse proxy level).

## Database

- Use Prisma parameterized queries — no raw SQL strings (unless absolutely necessary and reviewed).
- PrismaExceptionFilter catches and sanitizes Prisma errors before they reach the client.

## Validation Pipe Configuration

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```
