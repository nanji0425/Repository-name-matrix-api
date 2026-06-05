import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  /**
   * List published announcements (user-facing).
   * Filters by published=true and optional date range.
   */
  async findPublished() {
    const now = new Date();

    return this.prisma.announcement.findMany({
      where: {
        published: true,
        OR: [
          { startAt: null, endAt: null },
          {
            startAt: null,
            endAt: { gte: now },
          },
          {
            startAt: { lte: now },
            endAt: null,
          },
          {
            startAt: { lte: now },
            endAt: { gte: now },
          },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        content: true,
        priority: true,
        published: true,
        startAt: true,
        endAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * List all announcements (admin).
   */
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.announcement.findMany({
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.announcement.count(),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get a single announcement by ID.
   */
  async findById(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  /**
   * Create a new announcement (admin).
   */
  async create(dto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        priority: dto.priority ?? 0,
        published: dto.published ?? false,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        endAt: dto.endAt ? new Date(dto.endAt) : null,
      },
    });
  }

  /**
   * Update an announcement (admin).
   */
  async update(id: string, dto: Partial<CreateAnnouncementDto>) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');

    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.published !== undefined && { published: dto.published }),
        ...(dto.startAt !== undefined && { startAt: new Date(dto.startAt) }),
        ...(dto.endAt !== undefined && { endAt: new Date(dto.endAt) }),
      },
    });
  }

  /**
   * Delete an announcement (admin).
   */
  async delete(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');

    await this.prisma.announcement.delete({ where: { id } });
    return { message: 'Announcement deleted successfully' };
  }
}
