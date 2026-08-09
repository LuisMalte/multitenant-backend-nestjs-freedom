import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TenantConnectionManager } from './tenant-connection.manager';

/**
 * Módulo de infraestructura para la base de datos maestra.
 * Centraliza la instancia de PrismaService y, mediante @Global(), 
 * la expone a toda la aplicación sin requerir importaciones repetitivas.
 */
@Global()
@Module({
 providers: [
    PrismaService,
    TenantConnectionManager,
    
  ],
  exports: [PrismaService,
    TenantConnectionManager
  ],
})
export class DatabaseModule {}