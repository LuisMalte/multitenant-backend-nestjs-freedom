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
import { CustomerQueryDto } from './dto/customer-query.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

/**
 * Controlador REST para el recurso Customers (Clientes).
 * Intercepta las peticiones HTTP entrantes, valida la seguridad (Tenant y JWT),
 * y delega la lógica transaccional al servicio correspondiente.
 */


@ApiTags('Customers')
@Controller('customers')
@UseGuards(TenantGuard, JwtAuthGuard)
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
  ) {}

  /**
   * Crea un nuevo cliente.
   * 
   * @route POST /api/v1/customers
   * @param request - Contexto HTTP inyectado con el tenant y el usuario autenticado.
   * @param dto - Payload validado para la creación del cliente.
   */
  @Post()
  create(
    @Req() request: Request,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(request, dto);
  }

  /**
   * Obtiene un listado paginado y filtrado de clientes.
   * 
   * @route GET /api/v1/customers
   * @param request - Contexto HTTP inyectado.
   * @param query - Parámetros de URL para paginación, ordenamiento y filtros.
   */
  @Get()
  findAll(
    @Req() request: Request,
    @Query() query: CustomerQueryDto,
  ) {
    return this.customersService.findAll(request, query);
  }

  /**
   * Obtiene los detalles de un cliente específico.
   * 
   * @route GET /api/v1/customers/:id
   * @param request - Contexto HTTP inyectado.
   * @param id - Identificador UUID del cliente validado estrictamente.
   */
  @Get(':id')
  findOne(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customersService.findOne(request, id);
  }

  /**
   * Actualiza parcialmente los datos de un cliente.
   * 
   * @route PATCH /api/v1/customers/:id
   * @param request - Contexto HTTP inyectado.
   * @param id - Identificador UUID del cliente validado estrictamente.
   * @param dto - Payload con los campos específicos a actualizar.
   */
  @Patch(':id')
  update(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(request, id, dto);
  }

  /**
   * Elimina un cliente lógicamente (Soft Delete).
   * 
   * @route DELETE /api/v1/customers/:id
   * @param request - Contexto HTTP inyectado.
   * @param id - Identificador UUID del cliente validado estrictamente.
   */
  @Delete(':id')
  remove(
    @Req() request: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customersService.remove(request, id);
  }
}