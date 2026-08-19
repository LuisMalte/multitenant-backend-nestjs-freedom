import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TenantGuard } from '../../common/guards';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationQueryDto } from './dto/reservation-query.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationsService } from './reservations.service';

@ApiTags('Reservations')
@Controller('reservations')
@UseGuards(TenantGuard, JwtAuthGuard)
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
  ) {}

  @Post()
  create(
    @Req() request: Request,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.create(request, dto);
  }

  @Get()
  findAll(
    @Req() request: Request,
    @Query() query: ReservationQueryDto,
  ) {
    return this.reservationsService.findAll(request, query);
  }

  @Get(':id')
  findOne(
    @Req() request: Request,
    @Param('id') id: string,
  ) {
    return this.reservationsService.findOne(request, id);
  }

  @Patch(':id')
  update(
    @Req() request: Request,
    @Param('id') id: string,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(request, id, dto);
  }

  @Delete(':id')
  remove(
    @Req() request: Request,
    @Param('id') id: string,
  ) {
    return this.reservationsService.remove(request, id);
  }
}