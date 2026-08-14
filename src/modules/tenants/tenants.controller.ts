import { Body, Controller, Post } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
//Define un controlador para manejar las solicitudes relacionadas con los tenants
@Controller('tenants')
export class TenantsController {
  @Post()
  create(@Body() dto: CreateTenantDto) {
    return {
      message: 'Tenant creation endpoint ready',
      data: dto,
    };
  }
}