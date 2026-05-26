import { BaseListingFilter } from './filters';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectListingFilter implements BaseListingFilter {
  @ApiPropertyOptional({ default: 1 })
  page: number;

  @ApiPropertyOptional({ default: 10 })
  limit: number;

  @ApiPropertyOptional({ default: 'updatedAt' })
  sortBy: string;

  @ApiPropertyOptional({ default: 'desc' })
  sortOrder: 'asc' | 'desc';

  @ApiPropertyOptional({ default: undefined })
  searchTerm?: string;

  @ApiPropertyOptional({ default: undefined })
  updatedAtFrom?: Date;

  @ApiPropertyOptional({ default: undefined })
  updatedAtTo?: Date;
}
