import {
  Injectable,
  Logger,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';
import { UserResponseDTO } from './dto/user-response.dto';

@Injectable()
export class UserService {
  private readonly logger: LoggerService = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword, // Save the HASH
        name: createUserDto.name,
        preferences: {
          create: {
            theme: 'light',
            language: 'en',
          },
        },
      },
      include: {
        preferences: true,
      },
    });

    // Remove password from response
    const result = { ...user };
    delete (result as { password?: string }).password;
    return result;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    q?: string,
  ): Promise<PaginatedResponseDto<UserResponseDTO>> {
    const where: Prisma.UserWhereInput = q
      ? {
          OR: [{ name: { contains: q } }, { email: { contains: q } }],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: Prisma.SortOrder.asc },
        where,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: true,
          preferences: {
            select: {
              theme: true,
              language: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    this.logger.log(`Fetched ${users.length} users (Total: ${total})`);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true,
        preferences: {
          select: {
            theme: true,
            language: true,
          },
        },
      },
    });

    if (!user) {
      this.logger.warn('User not found');
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Fetched user with id ${id}`);
    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true,
        preferences: {
          select: {
            theme: true,
            language: true,
          },
        },
      },
    });

    if (!user) {
      this.logger.warn('User not found');
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Fetched user with email: ${email}`);
    return user;
  }

  async findByEmailWithPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn('User not found');
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: true,
        preferences: {
          select: {
            theme: true,
            language: true,
          },
        },
      },
    });
    this.logger.log(`Updated user with id ${id}`);
    return user;
  }

  async remove(id: number) {
    await this.prisma.user.delete({
      where: { id },
    });
    this.logger.log(`Deleted user with id ${id}`);
  }
}
