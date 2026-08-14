import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TenantConnectionManager } from './tenant-connection.manager';
import { PostgresProvisioningService } from './postgres-provisioning.service';
import { TenantMigrationService } from './tenant-migration.service';


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
    PostgresProvisioningService,
    TenantMigrationService
  ],
  exports: [
    PrismaService,
    TenantConnectionManager,
    PostgresProvisioningService,
    TenantMigrationService,
  ],
})
export class DatabaseModule {}