import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger: LoggerService = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          password: hashedPassword, // Save the HASH
          name: createUserDto.name,
        },
      });

      // Remove password from response
      const { password, ...result } = user;
      return result;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10) {
    let users: Partial<User>[];
    try {
      users = await this.prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: Prisma.SortOrder.asc },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: true,
        },
      });
    } catch (error) {
      this.logger.error('Failed to get users', error.stack);
      return new InternalServerErrorException(
        'Failed to get users because of a database error',
      );
    }

    this.logger.log(`Fetched ${limit} users from page ${page}`);

    return users;
  }

  async findById(id: number) {
    let user: Partial<User> | null;

    try {
      user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn('User not found');
        throw new NotFoundException('User not found');
      }
      this.logger.error('Failed to fetch user', error.stack);
      throw new InternalServerErrorException(
        'Failed to fetch user because of database error',
      );
    }

    if (!user) {
      this.logger.warn('User not found');
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Fetched user with id ${id}`);
    return user;
  }

  async findByEmail(email: string) {
    let user: Partial<User> | null;

    try {
      user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn('User not found');
        throw new NotFoundException('User not found');
      }
      this.logger.error('Failed to fetch user', error.stack);
      throw new InternalServerErrorException(
        'Failed to fetch user because of database error',
      );
    }

    if (!user) {
      this.logger.warn('User not found');
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Fetched user with email: ${email}`);
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    let user: Partial<User>;
    try {
      user = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn('User not found');
        throw new NotFoundException('User not found');
      }
      this.logger.error('Failed to fetch user', error.stack);
      throw new InternalServerErrorException(
        'Failed to fetch user because of database error',
      );
    }
    this.logger.log(`Updated user with id ${id}`);
    return user;
  }

  async remove(id: number) {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
      this.logger.log(`Deleted user with id ${id}`);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn('User not found');
        throw new NotFoundException('User not found');
      }
      this.logger.error(`Failed to deleted user`, error.stack);
      throw new InternalServerErrorException(
        'Failed to deleted user because of a database error',
      );
    }
  }
}
