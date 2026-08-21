import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ProjectService', () => {
  let service: ProjectService;
  const mockPrisma = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
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
        ProjectService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProjectById', () => {
    it('should throw NotFoundException if project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);
      await expect(service.getProjectById(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteProject', () => {
    it('should throw NotFoundException if project not found', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);
      await expect(service.deleteProject(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 1,
        ownerId: 2,
      });
      await expect(service.deleteProject(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
