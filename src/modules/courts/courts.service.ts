import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import type { Request } from 'express';

import { TenantContextService } from '../../common/tenancy';
import { CourtQueryDto } from './dto/court-query.dto';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';

// Interfaz explícita para el tipado estricto del token JWT
export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: string;
}

/**
 * Servicio encargado de la gestión de Canchas (Courts) a nivel de Tenant.
 * Opera exclusivamente bajo el contexto de una base de datos aislada y requiere
 * trazabilidad de auditoría para cualquier mutación de datos.
 */
@Injectable()
export class CourtsService {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly logger: Logger,
  ) {}

  /**
   * Crea un nuevo registro de cancha en la base de datos del inquilino actual.
   * Asigna automáticamente al operador ejecutor en los campos de auditoría.
   *
   * @param {Request} request - Objeto HTTP Request con contexto de tenant y autenticación.
   * @param {CreateCourtDto} dto - Carga útil validada con los datos de la cancha.
   * @returns {Promise<any>} El objeto de la cancha recién creada.
   */
  async create(request: Request, dto: CreateCourtDto) {
    const client = this.tenantContextService.getClient(request);
    const user = request.user as JwtPayload;
    const userId = user.sub;

    const court = await client.court.create({
      data: {
        name: dto.name,
        sport: dto.sport,
        pricePerHour: dto.pricePerHour,
        status: dto.status,
        createdBy: userId,
        updatedBy: userId,
      },
      select: {
        id: true,
        name: true,
        sport: true,
        pricePerHour: true,
        status: true,
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
        courtId: court.id,
      },
      'Tenant court created',
    );

    return court;
  }

  /**
   * Obtiene una lista paginada de canchas activas.
   * Ejecuta filtros dinámicos y excluye registros con eliminación lógica (Soft Delete).
   * La consulta de datos y el conteo se ejecutan en paralelo.
   *
   * @param {Request} request - Objeto HTTP Request con el contexto del tenant.
   * @param {CourtQueryDto} query - Parámetros de paginación, ordenamiento y filtrado.
   * @returns {Promise<{data: any[], meta: object}>} Colección de canchas y metadatos de paginación.
   */
  async findAll(request: Request, query: CourtQueryDto) {
    const client = this.tenantContextService.getClient(request);

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null, // Exclusión estricta de registros eliminados
      ...(query.name && {
        name: {
          contains: query.name,
          mode: 'insensitive' as const,
        },
      }),
      ...(query.sport && {
        sport: {
          contains: query.sport,
          mode: 'insensitive' as const,
        },
      }),
      ...(query.status && {
        status: {
          contains: query.status,
          mode: 'insensitive' as const,
        },
      }),
    };

    const [courts, total] = await Promise.all([
      client.court.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [query.sortBy]: query.order,
        },
        select: {
          id: true,
          name: true,
          sport: true,
          pricePerHour: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true,
          updatedBy: true,
          deletedAt: true,
        },
      }),
      client.court.count({
        where,
      }),
    ]);

    return {
      data: courts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca una cancha específica por su identificador primario.
   *
   * @param {Request} request - Objeto HTTP Request con el contexto del tenant.
   * @param {string} id - Identificador UUID de la cancha.
   * @throws {NotFoundException} Si la cancha no existe o fue eliminada lógicamente.
   * @returns {Promise<any>} La entidad solicitada.
   */
  async findOne(request: Request, id: string) {
    const client = this.tenantContextService.getClient(request);

    const court = await client.court.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        sport: true,
        pricePerHour: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        deletedAt: true,
      },
    });

    if (!court) {
      throw new NotFoundException('Court not found');
    }

    return court;
  }

  /**
   * Actualiza parcialmente la información de una cancha.
   * Registra el operador ejecutor en el campo de auditoría `updatedBy`.
   * Verifica la existencia previa del registro para mitigar Ghost Updating.
   *
   * @param {Request} request - Objeto HTTP Request con contexto y autenticación.
   * @param {string} id - Identificador UUID de la cancha a modificar.
   * @param {UpdateCourtDto} dto - Carga útil con los campos a actualizar.
   * @returns {Promise<any>} Entidad actualizada.
   */
  async update(request: Request, id: string, dto: UpdateCourtDto) {
    const client = this.tenantContextService.getClient(request);
    const user = request.user as JwtPayload;
    const userId = user.sub;

    await this.findOne(request, id);

    const court = await client.court.update({
      where: {
        id,
      },
      data: {
        ...dto,
        updatedBy: userId,
      },
      select: {
        id: true,
        name: true,
        sport: true,
        pricePerHour: true,
        status: true,
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
        courtId: court.id,
      },
      'Tenant court updated',
    );

    return court;
  }

  /**
   * Ejecuta una eliminación lógica (Soft Delete) sobre la cancha.
   * Muta el campo `deletedAt` en lugar de destruir la fila en base de datos.
   *
   * @param {Request} request - Objeto HTTP Request con contexto y autenticación.
   * @param {string} id - Identificador UUID de la cancha a eliminar.
   * @returns {Promise<any>} Entidad con el estado de eliminación aplicado.
   */
  async remove(request: Request, id: string) {
    const client = this.tenantContextService.getClient(request);
    const user = request.user as JwtPayload;
    const userId = user.sub;

    await this.findOne(request, id);

    const court = await client.court.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
      select: {
        id: true,
        name: true,
        sport: true,
        pricePerHour: true,
        status: true,
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
        courtId: court.id,
      },
      'Tenant court deleted',
    );

    return court;
  }
}