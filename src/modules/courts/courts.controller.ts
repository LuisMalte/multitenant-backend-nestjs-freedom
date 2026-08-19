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
  ParseUUIDPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TenantGuard } from '../../common/guards';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CourtQueryDto } from './dto/court-query.dto';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { CourtsService } from './courts.service';

/**
 * Controlador REST para el recurso Courts (Canchas).
 * Expone los endpoints de la API, impone la validación de seguridad (Tenant y Token JWT),
 * intercepta los parámetros HTTP y delega la ejecución de negocio al servicio.
 */

@ApiTags('Courts')
@Controller('courts')
@UseGuards(TenantGuard, JwtAuthGuard)
export class CourtsController {
  constructor(
    private readonly courtsService: CourtsService,
  ) {}

  /**
   * Crea una nueva cancha en el inquilino autenticado.
   *
   * @route POST /api/v1/courts
   * @param {Request} request - Contexto HTTP con los datos del tenant y del usuario.
   * @param {CreateCourtDto} dto - Estructura validada con los datos de creación.
   * @returns Entidad de la cancha creada.
   */
  @Post()
  create(
    @Req() request: Request,
    @Body() dto: CreateCourtDto,
  ) {
    return this.courtsService.create(request, dto);
  }

  /**
   * Lista las canchas del inquilino aplicando paginación y filtros dinámicos.
   *
   * @route GET /api/v1/courts
   * @param {Request} request - Contexto HTTP.
   * @param {CourtQueryDto} query - Parámetros de la URL (page, limit, name, sport, etc.).
   * @returns Objeto paginado con los datos y metadatos.
   */
  @Get()
  findAll(
    @Req() request: Request,
    @Query() query: CourtQueryDto,
  ) {
    return this.courtsService.findAll(request, query);
  }

  /**
   * Obtiene los detalles exactos de una cancha específica.
   * Aplica validación estricta de formato UUID antes de consultar la base de datos.
   *
   * @route GET /api/v1/courts/:id
   * @param {Request} request - Contexto HTTP.
   * @param {string} id - Identificador UUID de la cancha extraído de la URL.
   * @returns Entidad de la cancha solicitada.
   */
  @Get(':id')
  findOne(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.courtsService.findOne(request, id);
  }

  /**
   * Actualiza parcialmente la información de una cancha.
   *
   * @route PATCH /api/v1/courts/:id
   * @param {Request} request - Contexto HTTP.
   * @param {string} id - Identificador UUID validado.
   * @param {UpdateCourtDto} dto - Campos a modificar.
   * @returns Entidad de la cancha con los datos actualizados.
   */
  @Patch(':id')
  update(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourtDto,
  ) {
    return this.courtsService.update(request, id, dto);
  }

  /**
   * Ejecuta una baja lógica sobre una cancha específica.
   *
   * @route DELETE /api/v1/courts/:id
   * @param {Request} request - Contexto HTTP.
   * @param {string} id - Identificador UUID validado.
   * @returns Entidad de la cancha tras aplicar el estado de eliminación.
   */
  @Delete(':id')
  remove(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.courtsService.remove(request, id);
  }
}