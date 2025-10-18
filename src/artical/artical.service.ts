import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import ArticalResponseDto from './dto/artical-response.dto';
import { formatArticalResponse } from './artical.util';
import { createArticalDto } from './dto/create-artical.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ArticalService {
  constructor(private prisma: PrismaService) {}

  async getAllArticals(
    page: number,
    limit: number,
  ): Promise<ArticalResponseDto[]> {
    const options = {
      orderBy: { createdAt: Prisma.SortOrder.desc },
      include: {
        author: true,
      },
    };
    if (page && limit) {
      Object.assign(options, {
        skip: (page - 1) * limit,
        take: limit,
      });
    }
    const articals = await this.prisma.artical.findMany(options);

    // Map DB entities to DTOs (optional, for shaping the data)
    return articals.map((a) => ({
      ...formatArticalResponse(a),
      authorName: a.author.name,
    }));
  }

  async getArticalById(id: number): Promise<ArticalResponseDto> {
    const artical = await this.prisma.artical.findUnique({
      where: { id },
      include: {
        author: true,
      },
    });
    if (!artical) {
      throw new NotFoundException(`Artical with ID ${id} not found`);
    }
    return {
      ...formatArticalResponse(artical),
      authorName: artical.author.name,
    };
  }

  async createArtical(artical: createArticalDto): Promise<ArticalResponseDto> {
    const newArtical = await this.prisma.artical.create({
      data: {
        title: artical.title,
        description: artical.description,
        content: artical.content,
        authorId: artical.authorId,
      },
      include: {
        author: true,
      },
    });
    return {
      ...formatArticalResponse(newArtical),
      authorName: newArtical.author.name,
    };
  }
}
