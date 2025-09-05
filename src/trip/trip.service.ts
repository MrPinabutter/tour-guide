import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MemberRole, Prisma, Trip, User } from 'generated/prisma';
import { PrismaService } from 'src/prisma.service';
import { validateTripMemberPermissions } from 'src/utils/validation';
import { CreateTripDto, UpdateTripDto } from './dto/trip';
import { randomBytes } from 'crypto';
import * as dayjs from 'dayjs';

@Injectable()
export class TripService {
  constructor(private prisma: PrismaService) {}

  async getTrip({
    id,
    user,
  }: {
    id: string;
    user: User;
  }): Promise<Trip | null> {
    if (!id) {
      throw new Error('Trip ID is required');
    }

    const trip = await this.prisma.trip.findUnique({
      where: { id: +id },
      include: {
        TripMember: true,
        steps: true,
      },
    });

    if (
      !validateTripMemberPermissions({
        user,
        tripMembers: trip.TripMember,
        allowedRoles: ['ADMIN', 'CREATOR', 'MEMBER'],
      }) &&
      trip.visibility === 'PRIVATE'
    )
      throw new ForbiddenException(
        'You do not have permission to update this trip',
      );

    return trip;
  }

  async getMyTrips(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.TripWhereUniqueInput;
    where?: Prisma.TripWhereInput;
    orderBy?: Prisma.TripOrderByWithRelationInput;
    user: { id: number; role: string };
  }): Promise<Trip[]> {
    const { skip, take, cursor, where, orderBy } = params;

    const whereCondition: Prisma.TripWhereInput = {
      ...where,
      TripMember: {
        some: {
          userId: params.user?.id,
          role: {
            in: ['CREATOR', 'ADMIN', 'MEMBER'],
          },
          active: true,
        },
      },
    };

    return this.prisma.trip.findMany({
      skip,
      take,
      cursor,
      where: whereCondition,
      orderBy,
      include: {
        TripMember: true,
        steps: true,
      },
    });
  }

  async getPublicTrips(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.TripWhereUniqueInput;
    where?: Prisma.TripWhereInput;
    orderBy?: Prisma.TripOrderByWithRelationInput;
  }): Promise<Trip[]> {
    const { skip, take, cursor, where = {}, orderBy } = params;
    const publicWhere: Prisma.TripWhereInput = {
      ...where,
      visibility: 'PUBLIC',
    };

    // TODO: handle friends-only visibility

    return await this.prisma.trip.findMany({
      skip,
      take,
      cursor,
      where: publicWhere,
      orderBy,
    });
  }

  async createTrip({
    data,
    user,
  }: {
    data: CreateTripDto;
    user: { id: number | string; role: string };
  }): Promise<Trip> {
    const newTrip = {
      name: data.name,
      coverPhoto: data.coverPhoto,
      description: data.description,
      steps: {
        create:
          data.steps?.map((step) => ({
            name: step.name,
            description: step.description,
            order: step.order,
            startDateTime: step.startDateTime,
            endDateTime: step.endDateTime,
            creator: {
              connect: {
                id: user.id,
              },
            },
            latitude: step.latitude,
            longitude: step.longitude,
          })) || [],
      },
      visibility: data.visibility || 'PUBLIC',
      TripMember: {
        create: {
          userId: user.id,
          role: 'CREATOR',
        },
      },
    } as Prisma.TripCreateInput;

    return this.prisma.trip.create({
      data: newTrip,
      include: {
        TripMember: true,
        steps: true,
      },
    });
  }

  async updateTrip(params: {
    id: number;
    data: UpdateTripDto;
    user: User;
  }): Promise<Trip> {
    const { id, data, user } = params;

    const trip = await this.prisma.trip.findFirst({
      where: {
        id: id,
      },
      include: {
        TripMember: true,
      },
    });

    if (!trip) throw new NotFoundException('Trip not found');

    if (!validateTripMemberPermissions({ user, tripMembers: trip.TripMember }))
      throw new ForbiddenException(
        'You do not have permission to update this trip',
      );

    return this.prisma.trip.update({ where: { id }, data });
  }

  async deleteTrip({ id, user }: { id: number; user: User }): Promise<Trip> {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: id,
      },
      include: {
        TripMember: true,
      },
    });

    if (!trip) throw new NotFoundException('Trip not found');

    if (!validateTripMemberPermissions({ user, tripMembers: trip.TripMember }))
      throw new ForbiddenException(
        'You do not have permission to update this trip',
      );

    return this.prisma.trip.delete({
      where: { id: +id },
    });
  }

  async generateInviteToken({
    id,
    expirationDate,
    inviteMode,
    user,
  }: {
    id: number;
    expirationDate?: string;
    inviteMode: MemberRole;
    user: User;
  }) {
    const trip = await this.prisma.trip.findUnique({
      where: {
        id,
      },
      include: {
        TripMember: true,
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found!');
    }

    if (!validateTripMemberPermissions({ user, tripMembers: trip.TripMember }))
      throw new ForbiddenException(
        'You do not have permission to update this trip',
      );

    if (expirationDate && dayjs(expirationDate).isBefore())
      throw new BadRequestException('Expiration date must be in the future');

    const token = randomBytes(32).toString('hex');

    return this.prisma.trip.update({
      where: {
        id,
      },
      data: {
        inviteToken: token,
        inviteTokenExpirationDate:
          expirationDate ?? dayjs().add(3, 'day').toISOString(),
        inviteMode,
      },
    });
  }

  async leaveTrip({ id, user }: { id: number; user: User }) {
    const trip = await this.prisma.trip.findUnique({
      where: {
        id,
      },
    });

    if (!trip) throw new NotFoundException('This invite token is expired!');

    return this.prisma.tripMember.update({
      where: {
        userId_tripId: {
          tripId: id,
          userId: user.id,
        },
      },
      data: {
        active: false,
      },
    });
  }

  

  async joinTrip({ token, user }: { token: string; user: User }) {
    const trip = await this.prisma.trip.findUnique({
      where: {
        inviteToken: token,
      },
    });

    if (!trip) throw new NotFoundException('This invite token is expired!');

    return this.prisma.tripMember.upsert({
      create: {
        tripId: trip.id,
        userId: user.id,
        role: trip.inviteMode,
      },
      update: {
        active: true,
      },
      where: {
        userId_tripId: {
          tripId: trip.id,
          userId: user.id,
        },
      },
    });
  }
}
