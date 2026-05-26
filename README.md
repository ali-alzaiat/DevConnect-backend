# DevConnect Backend

A modular REST API built with **NestJS 11**, **Prisma 6**, and **Redis** that powers the DevConnect developer platform. It provides authentication, article publishing, project management, task tracking, and code-snippet sharing — all behind a stateless JWT auth layer.

---

## Tech Stack

| Layer            | Technology                                    |
| ---------------- | --------------------------------------------- |
| Framework        | NestJS 11 (Express)                           |
| Language         | TypeScript 5                                  |
| Database         | MySQL (via Prisma ORM)                        |
| Caching          | Redis (via `@nestjs/cache-manager` + Keyv)    |
| Authentication   | Passport JWT + bcrypt                         |
| Logging          | Winston + Daily Rotate File                   |
| API Docs         | Swagger / OpenAPI (`/api`)                    |
| Linting          | ESLint 9 + Prettier                           |
| Git Hooks        | Husky + Commitlint (Conventional Commits)     |

---

## Prerequisites

- **Node.js** ≥ 22
- **npm** ≥ 10
- **Docker & Docker Compose** (recommended) — _or_ a local MySQL + Redis instance

---

## Getting Started

### Option A — Docker (recommended)

The easiest way to spin up the entire stack (API + MySQL + Redis):

```bash
docker compose up
```

This builds the app container and starts all services defined in `docker-compose.yml`.

### Option B — Run locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a `.env` file** in the project root (see [Environment Variables](#environment-variables)).

3. **Generate Prisma client & push schema**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Seed the database** _(optional)_

   ```bash
   npx prisma db seed
   ```

5. **Start the dev server**

   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3000`.

---

## Environment Variables

Create a `.env` file in the project root with the following values:

```env
DATABASE_URL="mysql://root:1234@localhost:3306/devconnect"
JWT_SECRET="yourSuperSecretKey"
REDIS_URL="redis://localhost:6379"
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

> When running via Docker Compose, the hostnames should point to the service names defined in `docker-compose.yml` (e.g. `mysql`, `redis`).

---

## API Documentation

Once the server is running, open your browser to:

```
http://localhost:3000/api
```

This launches the interactive **Swagger UI** with all available endpoints, request/response schemas, and authentication details.

---

## Project Structure

```
src/
├── main.ts                  # Bootstrap: pipes, CORS, Swagger, logging
├── app.module.ts            # Root module (imports all feature modules)
├── auth/                    # Login, signup, JWT strategy, guards, @CurrentUser decorator
├── user/                    # User CRUD, profile management
├── article/                 # Articles with cache-version pattern
├── project/                 # Projects & Tasks (Prisma transactions)
├── snippet/                 # Code snippets with tag relations
└── common/
    ├── prisma/              # PrismaService (DB connection)
    ├── logger/              # Winston configuration
    ├── filters/             # Global exception filters (PrismaExceptionFilter)
    └── interceptors/        # Request logging interceptor
```

---

## Available Scripts

| Script               | Description                                     |
| -------------------- | ----------------------------------------------- |
| `npm run start`      | Start the server (single run)                   |
| `npm run start:dev`  | Start with hot-reload (watch mode)              |
| `npm run start:debug`| Start with debugger + watch                     |
| `npm run start:prod` | Run the compiled production build                |
| `npm run build`      | Compile TypeScript via `nest build`              |
| `npm run lint`       | Lint & auto-fix with ESLint                      |
| `npm run format`     | Format code with Prettier                        |
| `npm test`           | Run unit tests (Jest)                            |
| `npm run test:watch` | Run tests in watch mode                          |
| `npm run test:cov`   | Run tests with coverage report                   |
| `npm run test:e2e`   | Run end-to-end tests                             |

---

## Key Architectural Concepts

### Stateless JWT Authentication

1. **Signup** → `POST /v1/auth/signup` — password hashed with bcrypt (10 rounds).
2. **Login** → `POST /v1/auth/login` — returns a signed JWT (`access_token`).
3. **Protected routes** — attach `Authorization: Bearer <token>`. The `JwtAuthGuard` validates the token via `JwtStrategy` and populates `req.user`.
4. **`@CurrentUser()` decorator** — type-safe extraction of the authenticated user in controllers.

### Cache-Version Pattern

Read-heavy endpoints (articles, projects) use a **versioned cache key** scheme:

```
article_v3_page_1_limit_10
```

On any write operation the version counter is incremented, naturally invalidating stale entries without pattern-based Redis deletes.

### Prisma ORM

- Schema lives in `prisma/schema.prisma`.
- Run `npx prisma generate` after schema changes to regenerate the typed client.
- Run `npx prisma db push` to sync the schema to MySQL (no migration history).
- Run `npx prisma migrate dev` for migration-based workflows.

---

## Contributing

1. This project uses **Conventional Commits** enforced by Commitlint + Husky.
2. Run `npm run lint` and `npm run format` before committing.
3. All PRs should pass `npm run build` and `npm test`.

---

## License

This project is private and unlicensed.
