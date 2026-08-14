import { PrismaClient } from '../../../generated/master/prisma/client';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Servicio de base de datos para la conexión a la Base Maestra (Catalog DB).
 * 
 * Extiende `PrismaClient` para proveer acceso directo a los métodos del ORM y
 * utiliza los ciclos de vida de NestJS (`OnModuleInit`, `OnModuleDestroy`) 
 * para gestionar la apertura y cierre de conexiones de forma segura.
 * 
 * Implementa el adaptador `PrismaPg` para la conexión nativa con PostgreSQL.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Inicializa la instancia de PrismaClient inyectando variables de entorno.
   * 
   * @param {ConfigService} configService - Servicio de NestJS para acceder a las variables de configuración.
   * @throws Lanzará una excepción automáticamente si alguna variable de entorno requerida no está definida (`getOrThrow`).
   */
  constructor(configService: ConfigService) {
    // Extracción estricta de credenciales de la base de datos maestra
    const host = configService.getOrThrow<string>('database.master.host');
    const port = configService.getOrThrow<number>('database.master.port');
    const name = configService.getOrThrow<string>('database.master.name');
    const user = configService.getOrThrow<string>('database.master.user');
    const password = configService.getOrThrow<string>(
      'database.master.password',
    );

    // Configuración del adaptador del driver de PostgreSQL
    const adapter = new PrismaPg({
      connectionString: `postgresql://${user}:${password}@${host}:${port}/${name}`,
    });

    // Llamada al constructor de PrismaClient inyectando el adaptador
    super({
      adapter,
    });
  }

  /**
   * Hook del ciclo de vida de NestJS.
   * Se ejecuta una vez que el módulo ha sido inicializado.
   * Establece la conexión con la base de datos maestra.
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * Hook del ciclo de vida de NestJS.
   * Se ejecuta cuando la aplicación recibe una señal de terminación.
   * Cierra la conexión activa para evitar fugas de memoria o conexiones huérfanas.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}