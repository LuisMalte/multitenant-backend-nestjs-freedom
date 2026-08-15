import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { TenantGuard } from '../../common/guards';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

/**
 * Controlador de Usuarios.
 * Gestiona las peticiones HTTP entrantes para el registro de nuevos usuarios
 * dentro de un tenant específico.
 */
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  /**
   * Endpoint público (dentro del contexto del tenant) para registro.
   */
  @Post()
  @UseGuards(TenantGuard) // Obliga a que la petición traiga un X-Tenant-Id válido
  create(
    @Req() request: Request, // Extrae el objeto request completo (que ya contiene request.tenant)
    @Body() dto: CreateUserDto, // Valida y sanitiza el body contra el DTO
  ) {
    // Delega la ejecución al servicio, pasando el contexto y los datos limpios.
    return this.usersService.create(request, dto);
  }
}