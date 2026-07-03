import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

function extractFieldFromConstraint(constraintName: string): string {
  // Prisma constraint names follow: TableName_field1_field2_key
  const parts = constraintName.split('_');
  if (parts.length < 3) return constraintName;
  // Remove table name (first) and 'key' suffix (last)
  return parts.slice(1, -1).join('_');
}

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly fieldLabels: Record<string, Record<string, string>> = {
    User: {
      email: 'email address',
      name: 'display name',
    },
    Article: {
      title: 'title',
      slug: 'slug',
    },
    Project: {
      name: 'name',
    },
    Snippet: {
      title: 'title',
    },
  };

  private extractFields(target: unknown): string[] {
    if (Array.isArray(target)) return target.map(String);
    if (typeof target === 'string') {
      const constraintName = target;
      const tableMatch = constraintName.match(/^(\w+)_/);
      const tableName = tableMatch?.[1] ?? '';
      const fieldName = extractFieldFromConstraint(constraintName);
      const labels = this.fieldLabels[tableName]?.[fieldName];
      return [labels ?? fieldName];
    }
    return [];
  }

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const fields = this.extractFields(exception.meta?.target);
        if (fields.length === 1) {
          message = `A record with this ${fields[0]} already exists.`;
        } else {
          message = `A record with these values already exists: ${fields.join(', ')}.`;
        }
        break;
      }
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message =
          (exception.meta?.cause as string) ||
          'The requested record was not found.';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Related record not found.';
        break;
      default:
        break;
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      errorCode: exception.code,
    });
  }
}
