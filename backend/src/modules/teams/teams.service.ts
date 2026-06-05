import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  /**
   * List teams owned by the current user.
   */
  async findByOwner(ownerId: string) {
    return this.prisma.team.findMany({
      where: { ownerId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, email: true, avatar: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * List teams where the current user is a member.
   */
  async findMemberTeams(userId: string) {
    return this.prisma.team.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        owner: {
          select: { id: true, username: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, email: true, avatar: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single team by ID.
   */
  async findById(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, username: true, email: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  /**
   * Create a new team.
   */
  async create(ownerId: string, dto: CreateTeamDto) {
    const existing = await this.prisma.team.findFirst({
      where: { ownerId, name: dto.name },
    });
    if (existing) {
      throw new BadRequestException('You already have a team with this name');
    }

    const team = await this.prisma.team.create({
      data: {
        name: dto.name,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: 'OWNER',
          },
        },
      },
      include: {
        owner: {
          select: { id: true, username: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    // If an initial member was specified, add them
    if (dto.memberId && dto.memberId !== ownerId) {
      await this.addMember(team.id, ownerId, dto.memberId);
    }

    return team;
  }

  /**
   * Add a member to a team (only the owner can do this).
   */
  async addMember(teamId: string, ownerId: string, memberUserId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    if (team.ownerId !== ownerId) {
      throw new ForbiddenException('Only the team owner can add members');
    }

    // Check if user is already a member
    const existing = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: memberUserId },
    });
    if (existing) {
      throw new BadRequestException('User is already a member of this team');
    }

    // Verify the user exists
    const user = await this.prisma.user.findUnique({ where: { id: memberUserId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.teamMember.create({
      data: {
        teamId,
        userId: memberUserId,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
    });
  }

  /**
   * Remove a member from a team (only the owner can do this).
   */
  async removeMember(teamId: string, ownerId: string, memberUserId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    if (team.ownerId !== ownerId) {
      throw new ForbiddenException('Only the team owner can remove members');
    }
    if (memberUserId === ownerId) {
      throw new BadRequestException('Cannot remove the team owner');
    }

    const member = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: memberUserId },
    });
    if (!member) throw new NotFoundException('Member not found in this team');

    await this.prisma.teamMember.delete({ where: { id: member.id } });
    return { message: 'Member removed successfully' };
  }

  /**
   * Delete a team (only the owner can do this).
   */
  async delete(teamId: string, ownerId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    if (team.ownerId !== ownerId) {
      throw new ForbiddenException('Only the team owner can delete the team');
    }

    await this.prisma.teamMember.deleteMany({ where: { teamId } });
    await this.prisma.team.delete({ where: { id: teamId } });

    return { message: 'Team deleted successfully' };
  }
}
