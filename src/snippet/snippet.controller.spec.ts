import { Test, TestingModule } from '@nestjs/testing';
import { SnippetController } from './snippet.controller';
import { SnippetService } from './snippet.service';

describe('SnippetController', () => {
  let controller: SnippetController;
  const mockSnippetService = {
    getAllSnippets: jest.fn(),
    getSnippetById: jest.fn(),
    createSnippet: jest.fn(),
    updateSnippet: jest.fn(),
    deleteSnippet: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SnippetController],
      providers: [{ provide: SnippetService, useValue: mockSnippetService }],
    }).compile();

    controller = module.get<SnippetController>(SnippetController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
