import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import type { Request } from 'express';

import { TenantContextService } from '../../common/tenancy';
import { ReservationQueryDto } from './dto/reservation-query.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly logger: Logger,
  ) {}

  async create(
    request: Request,
    dto: CreateReservationDto,
  ) {
    const client = this.tenantContextService.getClient(request);
    const userId = request.user!.sub;

    this.validateTimeRange(dto.startTime, dto.endTime);

    const [customer, court] = await Promise.all([
      client.customer.findFirst({
        where: {
          id: dto.customerId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      }),
      client.court.findFirst({
        where: {
          id: dto.courtId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (!court) {
      throw new NotFoundException('Court not found');
    }

    const reservation = await client.reservation.create({
      data: {
        date: new Date(dto.date),
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        status: dto.status,
        customerId: dto.customerId,
        courtId: dto.courtId,
        createdBy: userId,
        updatedBy: userId,
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        customerId: true,
        courtId: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        deletedAt: true,
      },
    });

    this.logger.log(
      {
        tenantId: request.tenant?.id,
        userId,
        reservationId: reservation.id,
      },
      'Tenant reservation created',
    );

    return reservation;
  }

  async findAll(
    request: Request,
    query: ReservationQueryDto,
  ) {
    const client = this.tenantContextService.getClient(request);

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(query.date && {
        date: new Date(query.date),
      }),
      ...(query.customerId && {
        customerId: query.customerId,
      }),
      ...(query.courtId && {
        courtId: query.courtId,
      }),
      ...(query.status && {
        status: {
          contains: query.status,
          mode: 'insensitive' as const,
        },
      }),
    };

    const [reservations, total] = await Promise.all([
      client.reservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [query.sortBy]: query.order,
        },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          status: true,
          customerId: true,
          courtId: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true,
          updatedBy: true,
          deletedAt: true,
        },
      }),
      client.reservation.count({
        where,
      }),
    ]);

    return {
      data: reservations,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    request: Request,
    id: string,
  ) {
    const client = this.tenantContextService.getClient(request);

    const reservation = await client.reservation.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        customerId: true,
        courtId: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        deletedAt: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  async update(
    request: Request,
    id: string,
    dto: UpdateReservationDto,
  ) {
    const client = this.tenantContextService.getClient(request);
    const userId = request.user!.sub;

    const currentReservation = await this.findOne(request, id);

    const finalStartTime =
  dto.startTime ?? this.timeToIso(currentReservation.startTime);

const finalEndTime =
  dto.endTime ?? this.timeToIso(currentReservation.endTime);

    this.validateTimeRange(finalStartTime, finalEndTime);

    if (dto.customerId) {
      const customer = await client.customer.findFirst({
        where: {
          id: dto.customerId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    }

    if (dto.courtId) {
      const court = await client.court.findFirst({
        where: {
          id: dto.courtId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!court) {
        throw new NotFoundException('Court not found');
      }
    }

    const reservation = await client.reservation.update({
      where: {
        id,
      },
      data: {
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.startTime && {
          startTime: new Date(dto.startTime),
        }),
        ...(dto.endTime && {
          endTime: new Date(dto.endTime),
        }),
        ...(dto.status && { status: dto.status }),
        ...(dto.customerId && { customerId: dto.customerId }),
        ...(dto.courtId && { courtId: dto.courtId }),
        updatedBy: userId,
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        customerId: true,
        courtId: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        deletedAt: true,
      },
    });

    this.logger.log(
      {
        tenantId: request.tenant?.id,
        userId,
        reservationId: reservation.id,
      },
      'Tenant reservation updated',
    );

    return reservation;
  }

  async remove(
    request: Request,
    id: string,
  ) {
    const client = this.tenantContextService.getClient(request);
    const userId = request.user!.sub;

    await this.findOne(request, id);

    const reservation = await client.reservation.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        customerId: true,
        courtId: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        deletedAt: true,
      },
    });

    this.logger.log(
      {
        tenantId: request.tenant?.id,
        userId,
        reservationId: reservation.id,
      },
      'Tenant reservation deleted',
    );

    return reservation;
  }

  private validateTimeRange(
  startTime: string,
  endTime: string,
) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const startMinutes =
    start.getUTCHours() * 60 +
    start.getUTCMinutes() +
    start.getUTCSeconds() / 60;

  const endMinutes =
    end.getUTCHours() * 60 +
    end.getUTCMinutes() +
    end.getUTCSeconds() / 60;

  if (
    Number.isNaN(startMinutes) ||
    Number.isNaN(endMinutes) ||
    endMinutes <= startMinutes
  ) {
    throw new BadRequestException(
      'endTime must be after startTime',
    );
  }
}
private timeToIso(value: Date): string {
  return `1970-01-01T${value
    .toISOString()
    .slice(11, 19)}.000Z`;
}
}