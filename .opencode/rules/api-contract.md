# API Contract Rules

## Importance

The backend's OpenAPI spec is the **contract** consumed by the frontend. Every change must keep it valid and accurate.

## Mandatory Decorators

Every controller and DTO must have complete Swagger decorators:

| Location | Required Decorator |
|---|---|
| Controller class | `@ApiTags("name")` |
| Each handler method | `@ApiOperation({ summary, description })` |
| Each handler method | `@ApiResponse`, `@ApiOkResponse`, `@ApiCreatedResponse` etc. |
| Auth-protected handlers | `@ApiBearerAuth()` |
| DTO classes | `@ApiProperty()` on every field |
| DTO classes | `@ApiExtraModels()` if using `@ApiResponse({ type })` |

## Generating the Spec

The spec is available at:
- `/api-json` (JSON format)
- `/api-yaml` (YAML format — consumed by frontend Orval)

## Rules

1. Never rename or remove a field from a response DTO without checking the frontend usage.
2. Never change endpoint paths without updating the frontend's router or Orval config.
3. Add new fields as `@IsOptional()` in DTOs to avoid breaking existing clients.
4. Use `@ApiQuery()` for explicit query parameter docs on endpoints with complex filtering.
5. Validate enums with `@IsEnum()` and document with `@ApiProperty({ enum: MyEnum })`.

## Before Merging

1. Start the backend and confirm `/api-yaml` returns a valid YAML file.
2. Verify the frontend can regenerate: `cd DevConnect-frontend && npm run generate-api`.
3. Check that no TypeScript errors appear in the generated code.
