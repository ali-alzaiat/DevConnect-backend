import { Test, TestingModule } from '@nestjs/testing';
import { SnippetService } from './snippet.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('SnippetService', () => {
  let service: SnippetService;
  const mockPrisma = {
    snippet: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnippetService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<SnippetService>(SnippetService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSnippetById', () => {
    it('should throw NotFoundException if snippet not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'USER' });
      mockPrisma.snippet.findFirst.mockResolvedValue(null);
      await expect(service.getSnippetById(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteSnippet', () => {
    it('should throw NotFoundException if snippet not found', async () => {
      mockPrisma.snippet.findUnique.mockResolvedValue(null);
      await expect(service.deleteSnippet(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not creator and no EDIT grant', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'USER' });
      mockPrisma.snippet.findUnique.mockResolvedValue({
        id: 1,
        creatorId: 2,
      });
      mockPrisma.snippet.findFirst.mockResolvedValue(null);
      await expect(service.deleteSnippet(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
