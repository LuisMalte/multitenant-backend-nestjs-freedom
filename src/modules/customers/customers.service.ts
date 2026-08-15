import {Injectable, NotFoundException,
}from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import type { Request } from 'express';

import { TenantContextService } from '../../common/tenancy';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

/**
 * Servicio encargado de la gestión de clientes (Customers) a nivel de Tenant.
 * Opera exclusivamente bajo el contexto de una base de datos aislada y requiere
 */
@Injectable()
export class CustomersService {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly logger: Logger,
  ) {}

  /**
   * Crea un nuevo registro de cliente en la base de datos del inquilino actual.
   * Asigna automáticamente al operador ejecutor en los campos de auditoría.
   *
   * @param {Request} request - Objeto HTTP Request que contiene el contexto del tenant y el usuario autenticado.
   * @param {CreateCustomerDto} dto - Carga útil validada con los datos del cliente.
   * @returns {Promise<any>} El objeto del cliente recién creado con sus campos selectos.
   */
  async create(request: Request, dto: CreateCustomerDto) {
    const client = this.tenantContextService.getClient(request);
    const userId = request.user!.sub;

    const customer = await client.customer.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        createdBy: userId,
        updatedBy: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
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
        customerId: customer.id,
      },
      'Tenant customer created',
    );

    return customer;
  }

  /**
   * Obtiene una lista paginada de clientes activos.
   * Ejecuta filtros dinámicos (insensibles a mayúsculas) y excluye registros con eliminación lógica (Soft Delete).
   * La consulta de datos y el conteo total se ejecutan en paralelo para optimizar el rendimiento.
   *
   * @param {Request} request - Objeto HTTP Request con el contexto del tenant.
   * @param {CustomerQueryDto} query - Parámetros de paginación, ordenamiento y filtrado.
   * @returns {Promise<{data: any[], meta: object}>} Colección de clientes y metadatos de paginación.
   */
  async findAll(request: Request, query: CustomerQueryDto) {
    const client = this.tenantContextService.getClient(request);

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(query.name && {
        name: {
          contains: query.name,
          mode: 'insensitive' as const,
        },
      }),
      ...(query.email && {
        email: {
          contains: query.email,
          mode: 'insensitive' as const,
        },
      }),
      ...(query.phone && {
        phone: {
          contains: query.phone,
        },
      }),
    };

    const [customers, total] = await Promise.all([
      client.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [query.sortBy]: query.order,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true,
          updatedBy: true,
          deletedAt: true,
        },
      }),
      client.customer.count({
        where,
      }),
    ]);

    return {
      data: customers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca un cliente específico por su identificador primario.
   * Aplica la regla de exclusión para registros eliminados lógicamente.
   *
   * @param {Request} request - Objeto HTTP Request con el contexto del tenant.
   * @param {string} id - Identificador UUID del cliente.
   * @throws {NotFoundException} Si el cliente no existe o fue eliminado lógicamente.
   * @returns {Promise<any>} La entidad del cliente solicitada.
   */
  async findOne(request: Request, id: string) {
    const client = this.tenantContextService.getClient(request);

    const customer = await client.customer.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        deletedAt: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  /**
   * Actualiza parcialmente la información de un cliente existente.
   * Registra el operador ejecutor en el campo de auditoría `updatedBy`.
   * Verifica la existencia previa del registro para mitigar vulnerabilidades de Ghost Updating.
   *
   * @param {Request} request - Objeto HTTP Request con contexto y autenticación.
   * @param {string} id - Identificador UUID del cliente a mutar.
   * @param {UpdateCustomerDto} dto - Carga útil con los campos a actualizar.
   * @returns {Promise<any>} Entidad del cliente actualizada.
   */
  async update(
    request: Request,
    id: string,
    dto: UpdateCustomerDto,
  ) {
    const client = this.tenantContextService.getClient(request);
    const userId = request.user!.sub;

    await this.findOne(request, id);

    const customer = await client.customer.update({
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
        email: true,
        phone: true,
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
        customerId: customer.id,
      },
      'Tenant customer updated',
    );

    return customer;
  }

  /**
   * Ejecuta una eliminación lógica (Soft Delete) sobre el cliente.
   * Muta el campo `deletedAt` y actualiza la trazabilidad con el identificador del operador.
   *
   * @param {Request} request - Objeto HTTP Request con contexto y autenticación.
   * @param {string} id - Identificador UUID del cliente a eliminar.
   * @returns {Promise<any>} Entidad del cliente con el estado de eliminación aplicado.
   */
  async remove(request: Request, id: string) {
    const client = this.tenantContextService.getClient(request);
    const userId = request.user!.sub;

    await this.findOne(request, id);

    const customer = await client.customer.update({
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
        email: true,
        phone: true,
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
        customerId: customer.id,
      },
      'Tenant customer deleted',
    );

    return customer;
  }
}