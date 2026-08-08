import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Módulo de infraestructura para la base de datos maestra.
 * Centraliza la instancia de PrismaService y, mediante @Global(), 
 * la expone a toda la aplicación sin requerir importaciones repetitivas.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}