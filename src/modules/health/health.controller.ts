import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Endpoint de salud público.
   * Valida que el proceso de Node.js responda y que exista 
   * conectividad activa con la Base de Datos Maestra.
   */
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () =>
        this.prismaIndicator.pingCheck(
          'master-database',
          this.prismaService,
        ),
    ]);
  }
}   