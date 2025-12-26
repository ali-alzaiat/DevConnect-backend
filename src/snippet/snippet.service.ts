import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, LoggerService, NotFoundException } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';
import SnippetResponseDTO from './dto/snippet-response.dto';
import { mapSnippetToDTO } from './snippet.util';
import CreateSnippetDTO from './dto/create-snippet.dto';

@Injectable()
export class SnippetService {
    constructor(
        private prisma: PrismaService,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
        (this.logger as any).setContext(SnippetService.name);
    }

    private cacheKey(page: number, limit: number) {
      return `snippets_page_${page}_limit_${limit}`;
    }
    
    async getAllSnippets(page: number, limit: number): Promise<SnippetResponseDTO[]> {
        const cacheKey = this.cacheKey(page, limit);
            const cachedSnippets: SnippetResponseDTO[] | undefined =
              await this.cacheManager.get(cacheKey);
            if (cachedSnippets) {
              this.logger.log(
                `Returning cached snippets for page ${page} with limit ${limit}`,
              );
              return cachedSnippets;
            }
            const options = {
              orderBy: { createdAt: Prisma.SortOrder.desc },
              include: {
                creator: {
                  select: { id: true, name: true },
                },
                tags: true
              },
            };
        
            if (page && limit) {
              Object.assign(options, {
                skip: (page - 1) * limit,
                take: limit,
              });
            }
        
            const snippets = await this.prisma.snippet.findMany(options);

            const res = snippets.map(mapSnippetToDTO);
        
            await this.cacheManager.set(cacheKey, res);
        
            this.logger.log(`Fetched ${res.length} snippets`);
        
            return res;
    }

    async getSnippetById(id: number): Promise<SnippetResponseDTO> {
      const snippet = await this.prisma.snippet.findUnique({
        where: { id },
        include: {
          creator: {
            select: { id: true, name: true },
          },
          tags: true
        }
      });

      if(!snippet) {
        this.logger.warn(`Snippet with ID ${id} not found`);
        throw new NotFoundException(`Snippet with ID ${id} not found`);
      }

      this.logger.log(`Fetched snippet with ID ${id}`);
      return mapSnippetToDTO(snippet);
    }

    async createSnippet(snippet: CreateSnippetDTO): Promise<SnippetResponseDTO> {
      const newSnippet = await this.prisma.snippet.create({
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
        },
      });

      this.logger.log(`Created new snippet with ID ${newSnippet.id}`);

      return newSnippet;
    }
}
