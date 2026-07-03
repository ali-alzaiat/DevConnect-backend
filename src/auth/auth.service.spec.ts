import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUserService = {
    create: jest.fn(),
    findByEmailWithPassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a user successfully', async () => {
      const dto = {
        email: 'test@test.com',
        password: 'Password123!',
        name: 'Test User',
      };
      const mockUser = { id: 1, ...dto };
      mockUserService.create.mockResolvedValue(mockUser);

      const result = await service.signup(dto);
      expect(result).toEqual(mockUser);
      expect(mockUserService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@test.com', password: 'Password123!' };
    const mockUser = {
      id: 1,
      email: 'test@test.com',
      password: 'hashedPassword',
      name: 'Test User',
    };

    it('should login successfully with correct credentials', async () => {
      mockUserService.findByEmailWithPassword.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        token: 'mock-jwt-token',
        user: { id: 1, email: 'test@test.com', name: 'Test User' },
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockUserService.findByEmailWithPassword.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockUserService.findByEmailWithPassword.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
