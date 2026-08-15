import {Controller,Get,Req, UseGuards,} from '@nestjs/common';
import type { Request } from 'express';
import { TenantGuard } from '../common/guards';
import { TenantContextService } from '../common/tenancy';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';



// Controlador de prueba para verificar la resolución del contexto de inquilino y la conexión a la base de datos física.
@Controller('test')
export class TenantClientController {
  // Inyecta el servicio de contexto de inquilino para acceder a la conexión específica del tenant.
  constructor(
    private readonly tenantContextService: TenantContextService,
  ) {}
// Endpoint de prueba para obtener el nombre de la base de datos del tenant actual.
  @Get('tenant-client')
  // Aplica los guardias de seguridad para validar el tenant y el JWT.
  @UseGuards(TenantGuard, JwtAuthGuard) 
  // Maneja la solicitud GET y devuelve el nombre de la base de datos del tenant.
  async getTenantDatabase(@Req() request: Request) {
    const client = this.tenantContextService.getClient(request);

    const result = await client.$queryRaw<
      Array<{ current_database: string }>
    >`SELECT current_database()`;

    return {
      database: result[0]?.current_database,
    };
  }
}