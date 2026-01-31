import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Cache } from 'cache-manager';
import { Prisma, Snippet, Tag, User } from '@prisma/client';
import SnippetResponseDTO from './dto/snippet-response.dto';
import { mapSnippetToDTO } from './snippet.util';
import CreateSnippetDTO from './dto/create-snippet.dto';
import { UpdateSnippetDto } from './dto/update-snippet.dto';

type SnippetWithCreator = Snippet & {
  creator: Pick<User, 'id' | 'name'> | null;
  tags: Tag[];
};

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
  ): Promise<SnippetResponseDTO[]> {
    const cacheKey = await this.getCacheKey(page, limit);
    const cachedSnippets: SnippetResponseDTO[] | undefined =
      await this.cacheManager.get(cacheKey);
    if (cachedSnippets) {
      this.logger.log(
        `Returning cached snippets for page ${page} with limit ${limit}`,
      );
      return cachedSnippets;
    }
    let snippets: Snippet[];

    try {
      snippets = await this.prisma.snippet.findMany({
        orderBy: { createdAt: Prisma.SortOrder.desc },
        include: {
          creator: {
            select: { id: true, name: true },
          },
          tags: true,
        },
      });
    } catch (error) {
      this.logger.error(
        'Failed to get snippets because of database error',
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to get snippets because of database error',
      );
    }

    const res = snippets.map(mapSnippetToDTO);

    await this.cacheManager.set(cacheKey, res);

    this.logger.log(`Fetched ${res.length} snippets`);

    return res;
  }

  async getSnippetById(id: number): Promise<SnippetResponseDTO> {
    let snippet: SnippetWithCreator | null;
    try {
      snippet = await this.prisma.snippet.findUnique({
        where: { id },
        include: {
          creator: {
            select: { id: true, name: true },
          },
          tags: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`Snippet with ID ${id} not found for update`);
        throw new NotFoundException('Snippet not found');
      }
      this.logger.error(
        `Failed to get snippet with ID ${id} because of a database error`,
      );
      throw new InternalServerErrorException(
        'Failed to get snippet because of a database error',
      );
    }

    if (!snippet) {
      this.logger.warn(`Snippet with ID ${id} not found`);
      throw new NotFoundException(`Snippet with ID ${id} not found`);
    }

    this.logger.log(`Fetched snippet with ID ${id}`);
    return mapSnippetToDTO(snippet);
  }

  async createSnippet(snippet: CreateSnippetDTO): Promise<SnippetResponseDTO> {
    let newSnippet: SnippetWithCreator;

    try {
      newSnippet = await this.prisma.snippet.create({
        data: {
          name: snippet.name,
          code: snippet.code,
          description: snippet.description,
          creator: { connect: { id: 1 } },
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
    } catch (error) {
      this.logger.error(
        'Failed to create snippet because of a database error',
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to create snippet because of a database error',
      );
    }

    this.logger.log(`Created new snippet with ID ${newSnippet.id}`);
    await this.invalidateSnippetCache();

    return newSnippet;
  }

  async deleteSnippet(id: number) {
    try {
      await this.prisma.snippet.delete({
        where: { id },
      });
      this.logger.log(`deleted snippet with id ${id}`);
      await this.invalidateSnippetCache();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`Snippet with ID ${id} not found for delete`);
        throw new NotFoundException('Snippet not found');
      }
      this.logger.warn(`Failed to delete snippet with id ${id}`, error.stack);
      throw new InternalServerErrorException(
        'Failed to delete snippet because of a database error',
      );
    }
  }

  async updateSnippet(
    id: number,
    updateSnippetDto: UpdateSnippetDto,
  ): Promise<SnippetResponseDTO> {
    let snippet: SnippetWithCreator;
    try {
      snippet = await this.prisma.$transaction(async (tx) => {
        // STEP 1: If tags are provided, we first clear the EXISTING relationships.
        // If 'tags' is undefined, we skip this to preserve the current tags (PATCH behavior).
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

        // STEP 2: Update the snippet details and link the NEW tags.
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
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`Snippet with ID ${id} not found for update`);
        throw new NotFoundException('Snippet not found');
      }
      this.logger.warn(`Failed to update snippet with id ${id}`, error.stack);
      throw new InternalServerErrorException(
        'Failed to update snippet because of a database error',
      );
    }

    this.logger.log(`Updated snippet with id ${id}`);
    this.invalidateSnippetCache();

    return mapSnippetToDTO(snippet);
  }
}
