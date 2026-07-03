# NestJS Patterns

## Module Structure

Each feature module follows:

```
src/{feature}/
  {feature}.module.ts       -- @Module({ imports, controllers, providers, exports })
  {feature}.controller.ts   -- @Controller() with route handlers
  {feature}.service.ts      -- Business logic, injected via constructor
  dto/                      -- class-validator DTOs for input validation
  entities/                 -- TypeScript entities (may mirror Prisma models)
  {feature}.util.ts         -- Pure utility functions (optional)
```

## Controllers

1. Single responsibility — one controller per domain entity.
2. Use Swagger decorators on every endpoint: `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`.
3. Validate inputs via DTOs — never use raw body/query types.
4. Return DTOs or entities, never Prisma models directly (use `@ApiOkResponse({ type: XxxDto })`).

```ts
@Controller("v1/projects")
@ApiTags("Projects")
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @ApiOperation({ summary: "List all projects" })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(@Query() filter: ProjectFilterDto) {
    return this.projectService.findAll(filter);
  }
}
```

## Services

1. Business logic only — no HTTP concerns.
2. Use PrismaService for DB access via constructor injection.
3. Methods should be async and return Promises.
4. Keep services testable — inject dependencies, do not instantiate directly.

## Dependency Injection

1. Use `@Injectable()` decorator on all services.
2. Export services from the module so other modules can use them.
3. Use `@Inject(forwardRef(() => OtherModule))` only when absolutely necessary for circular deps — prefer restructuring.

## DTOs

1. Use `class-validator` decorators for validation: `@IsString()`, `@IsOptional()`, `@IsInt()`, `@Min()`, etc.
2. Use `class-transformer` decorators for serialization: `@Expose()`, `@Exclude()`, `@Transform()`.
3. Use `@ApiProperty()` for Swagger documentation on every DTO field.

```ts
export class CreateProjectDto {
  @ApiProperty({ example: "My Project" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
```
