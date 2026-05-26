import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';
import SnippetResponseDTO from './dto/snippet-response.dto';
import { mapSnippetToDTO } from './snippet.util';
import CreateSnippetDTO from './dto/create-snippet.dto';
import { UpdateSnippetDto } from './dto/update-snippet.dto';
import { UserEntity } from 'src/user/entities/user.entity';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class SnippetService {
  private readonly logger: LoggerService = new Logger(SnippetService.name);
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async getSnippetCacheVersion(): Promise<number> {
    const version = await this.cacheManager.get('snippet_version');
    return (version as number) || 1;
  }

  private async incrementSnippetVersion() {
    const version = await this.getSnippetCacheVersion();
    await this.cacheManager.set('snippet_version', version + 1, 0);
  }

  private async invalidateSnippetCache() {
    await this.incrementSnippetVersion();
  }

  private async getCacheKey(page: number, limit: number) {
    const version = await this.getSnippetCacheVersion();
    return `snippets_version_${version}_page_${page}_limit_${limit}`;
  }

  async getAllSnippets(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponseDto<SnippetResponseDTO>> {
    const cacheKey = await this.getCacheKey(page, limit);
    const cachedData: PaginatedResponseDto<SnippetResponseDTO> | undefined =
      await this.cacheManager.get(cacheKey);

    if (cachedData) {
      this.logger.log(
        `Returning cached snippets for page ${page} with limit ${limit}`,
      );
      return cachedData;
    }

    const [snippets, total] = await Promise.all([
      this.prisma.snippet.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: Prisma.SortOrder.desc },
        include: {
          creator: {
            select: { id: true, name: true },
          },
          tags: true,
        },
      }),
      this.prisma.snippet.count(),
    ]);

    const data = snippets.map(mapSnippetToDTO);
    const totalPages = Math.ceil(total / limit);

    const res: PaginatedResponseDto<SnippetResponseDTO> = {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    await this.cacheManager.set(cacheKey, res);

    this.logger.log(`Fetched ${data.length} snippets (Total: ${total})`);

    return res;
  }

  async getSnippetById(id: number): Promise<SnippetResponseDTO> {
    const snippet = await this.prisma.snippet.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true },
        },
        tags: true,
      },
    });

    if (!snippet) {
      this.logger.warn(`Snippet with ID ${id} not found`);
      throw new NotFoundException(`Snippet with ID ${id} not found`);
    }

    this.logger.log(`Fetched snippet with ID ${id}`);
    return mapSnippetToDTO(snippet);
  }

  async createSnippet(
    snippet: CreateSnippetDTO,
    user: UserEntity,
  ): Promise<SnippetResponseDTO> {
    const newSnippet = await this.prisma.snippet.create({
      data: {
        name: snippet.name,
        code: snippet.code,
        description: snippet.description,
        creator: { connect: { id: user.userId } },
        tags: {
          connectOrCreate: snippet.tags.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: {
        tags: true,
        creator: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Created new snippet with ID ${newSnippet.id}`);
    await this.invalidateSnippetCache();

    return mapSnippetToDTO(newSnippet);
  }

  async deleteSnippet(id: number, userId: number) {
    const snippet = await this.prisma.snippet.findUnique({
      where: { id },
    });

    if (!snippet) {
      throw new NotFoundException(`Snippet with ID ${id} not found`);
    }

    if (snippet.creatorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this snippet',
      );
    }

    await this.prisma.snippet.delete({
      where: { id },
    });
    this.logger.log(`deleted snippet with id ${id}`);
    await this.invalidateSnippetCache();
  }

  async updateSnippet(
    id: number,
    updateSnippetDto: UpdateSnippetDto,
    userId: number,
  ): Promise<SnippetResponseDTO> {
    const existingSnippet = await this.prisma.snippet.findUnique({
      where: { id },
    });

    if (!existingSnippet) {
      throw new NotFoundException(`Snippet with ID ${id} not found`);
    }

    if (existingSnippet.creatorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this snippet',
      );
    }

    const snippet = await this.prisma.$transaction(async (tx) => {
      if (updateSnippetDto.tags) {
        await tx.snippet.update({
          where: { id },
          data: {
            tags: {
              set: [], // This disconnects all currently linked tags
            },
          },
        });
      }

      return tx.snippet.update({
        where: { id },
        data: {
          name: updateSnippetDto.name,
          code: updateSnippetDto.code,
          description: updateSnippetDto.description,

          // We conditionally add the 'tags' object only if it exists in the DTO
          ...(updateSnippetDto.tags && {
            tags: {
              connectOrCreate: updateSnippetDto.tags.map((name) => ({
                where: { name },
                create: { name },
              })),
            },
          }),
        },
        include: {
          tags: true,
          creator: { select: { id: true, name: true } },
        },
      });
    });

    this.logger.log(`Updated snippet with id ${id}`);
    await this.invalidateSnippetCache();

    return mapSnippetToDTO(snippet);
  }
}
