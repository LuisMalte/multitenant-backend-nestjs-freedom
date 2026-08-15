import { Module } from '@nestjs/common';

import { TenancyModule } from '../../common/tenancy';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

/**
 * Módulo de Usuarios.
 * Encapsula el dominio de negocio relacionado con las cuentas de los usuarios del tenant.
 */
@Module({
  imports: [TenancyModule], // Dependencia requerida para obtener TenantContextService
  providers: [UsersService], // Instancia el servicio de lógica de negocio
  exports: [UsersService], // Lo hace público para que AuthModule pueda usarlo al hacer login
  controllers: [UsersController], // Expone el controlador para manejar las rutas HTTP relacionadas con usuarios

})
export class UsersModule {}