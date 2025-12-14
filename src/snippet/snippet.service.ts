import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';
import SnippetResponseDTO from './dto/snippet-response.dto';
import { formatSnippetResponse } from './snippet.util';

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
    
    async getAllSnippets(page: number, limit: number) {
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
                creator: true,
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

            const res = snippets.map((s) => ({
              ...formatSnippetResponse(s),
              creatorName: s.creator.name,
              tags: s.tags,
            }));
        
            await this.cacheManager.set(cacheKey, res);
        
            this.logger.log(`Fetched ${res.length} snippets`);
        
            return res;
    }
}
