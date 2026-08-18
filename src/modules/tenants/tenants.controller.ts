import {Body,Controller,Get,Param,ParseUUIDPipe,
  Patch,Post,Query,} from '@nestjs/common';

import {
  CreateTenantDto,
  TenantQueryDto,
  UpdateTenantStatusDto,
} from './dto';
import { TenantsService } from './tenants.service';

/**
 * Controlador REST para la gestión maestra de Tenants.
 * Estas rutas operan a nivel de infraestructura (Master DB) y orquestan
 * el ciclo de vida de los clientes del SaaS.
 */
@Controller('tenants')
export class TenantsController {
  // constructor inyecta el servicio TenantsService para manejar la lógica de negocio
  constructor(private readonly tenantsService: TenantsService) {}

  // Define un endpoint POST para crear un nuevo tenant
  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  // Define un endpoint GET para listar tenants con filtros y paginación
  @Get()
  findAll(@Query() query: TenantQueryDto) {
    return this.tenantsService.findAll(query);
  }

  // Define un endpoint GET para obtener los detalles de un tenant específico
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.findOne(id);
  }

  // Define un endpoint PATCH para activar/desactivar un tenant
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantStatusDto,
  ) {
    return this.tenantsService.updateStatus(id, dto);
  }
}