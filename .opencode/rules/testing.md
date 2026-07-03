# Testing Rules

## Test Types

| Level | What | Tool | Naming |
|---|---|---|---|
| Unit | Services (mocked Prisma/Redis) | Jest | `*.service.spec.ts` |
| Integration | Controllers (supertest + test module) | Jest + `@nestjs/testing` + supertest | `*.controller.spec.ts` |
| E2E | Full HTTP requests against running app | Jest + supertest | In `test/` directory |

## Service Testing

```ts
describe("ProjectService", () => {
  let service: ProjectService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: PrismaService, useValue: mockDeep<PrismaClient>() },
      ],
    }).compile();
    service = module.get(ProjectService);
    prisma = module.get(PrismaService);
  });

  it("creates a project", async () => {
    prisma.project.create.mockResolvedValue(mockProject);
    const result = await service.create(dto);
    expect(result).toEqual(mockProject);
  });
});
```

## Controller Testing

Use `@nestjs/testing` and `supertest` to spin up a test module with real pipes/guards.

## Guidelines

1. Every service method must have at least one unit test.
2. Every controller route must have at least one integration test (happy path).
3. Mock external services (Prisma, Redis) — never hit a real database.
4. Test error paths: validation errors, not-found, unauthorized, forbidden.
5. Aim for > 80% coverage on services, > 70% on controllers, > 50% overall.
6. E2E tests in `test/` cover critical user journeys (signup → login → CRUD).

## Running Tests

```bash
npm test           # Unit + integration
npm run test:cov   # With coverage
npm run test:e2e   # E2E tests
```
