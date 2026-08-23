import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from './article.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ArticleService', () => {
  let service: ArticleService;
  let prisma: {
    article: Record<string, jest.Mock>;
    user: Record<string, jest.Mock>;
  };

  let cacheManager: Record<string, jest.Mock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: PrismaService,
          useValue: {
            article: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
    prisma = module.get(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllArticles', () => {
    it('should return cached articles when available', async () => {
      const cached = {
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };
      prisma.article.findMany.mockResolvedValue([]);
      prisma.article.count.mockResolvedValue(0);

      cacheManager.get.mockResolvedValue(cached);

      const result = await service.getAllArticles(1, 10);
      expect(result).toEqual(cached);
    });
  });

  describe('getArticleById', () => {
    it('should throw NotFoundException if article not found', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'USER' });
      prisma.article.findFirst.mockResolvedValue(null);
      await expect(service.getArticleById(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createArticle', () => {
    it('should create article and invalidate cache', async () => {
      const mockArticle = {
        id: 1,
        title: 'Test',
        description: '',
        content: '',
        author: { id: 1, name: 'User' },
        authorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.article.create.mockResolvedValue(mockArticle);

      cacheManager.set.mockResolvedValue(undefined);
      cacheManager.get.mockResolvedValue(1);

      const result = await service.createArticle(
        { title: 'Test', description: '', content: '' },
        { userId: 1, email: 'test@test.com', name: 'Test' },
      );
      expect(result.id).toBe(1);
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('updateArticle', () => {
    it('should throw ForbiddenException if not author and no EDIT grant', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'USER' });
      prisma.article.findUnique.mockResolvedValue({
        authorId: 2,
        id: 1,
        title: '',
        description: '',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.article.findFirst.mockResolvedValue(null);
      await expect(service.updateArticle(1, {}, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('deleteArticle', () => {
    it('should throw ForbiddenException if not author and no EDIT grant', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'USER' });
      prisma.article.findUnique.mockResolvedValue({
        authorId: 2,
        id: 1,
        title: '',
        description: '',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.article.findFirst.mockResolvedValue(null);
      await expect(service.deleteArticle(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
