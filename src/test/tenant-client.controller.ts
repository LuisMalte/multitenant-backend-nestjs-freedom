import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { TenantGuard } from '../common/guards';
import { TenantContextService } from '../common/tenancy';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';


// Controlador de Pruebas de Aislamiento de Tenants.
@Controller('test')
export class TenantClientController {
  // Inyecta el servicio de contexto de tenant para obtener la conexión a la base de datos del tenant.
  constructor(
    private readonly tenantContextService: TenantContextService,
  ) {}

  // }Solo valida aislamiento físico. Usado por la Prueba 1. 
  @Get('tenant-client')
  // Usa el guardián de tenant para asegurar que la petición tenga un X-Tenant-Id válido.
  @UseGuards(TenantGuard)
  async getTenantDatabase(@Req() request: Request) {
    const client = this.tenantContextService.getClient(request);

    const result = await client.$queryRaw<
      Array<{ current_database: string }>
    >`SELECT current_database()`;

    return {
      // Retorna el nombre de la base de datos actual para verificar aislamiento físico.
      database: result[0]?.current_database,
    };
  }

  //  Valida aislamiento criptográfico estricto.
  @Get('tenant-client-secure')
  // Usa ambos guardianes: TenantGuard para validar el tenant y JwtAuthGuard para validar el token JWT.
  @UseGuards(TenantGuard, JwtAuthGuard)
  async getTenantDatabaseSecure(@Req() request: Request) {
    const client = this.tenantContextService.getClient(request);

    const result = await client.$queryRaw<
      Array<{ current_database: string }>
    >`SELECT current_database()`;

    return {
      database: result[0]?.current_database,
    };
  }
}