import { Body, Controller, Post } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantsService } from './tenants.service';
//Define un controlador para manejar las solicitudes relacionadas con los tenants
@Controller('tenants')
export class TenantsController {
    //constructor inyecta el servicio TenantsService para manejar la lógica de negocio relacionada con los tenants
    constructor(
    private readonly tenantsService: TenantsService,
  ) {}
  
//Define un endpoint POST para crear un nuevo tenant, que recibe un DTO con los datos del tenant y delega la creación al servicio correspondiente   
  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }
  
}