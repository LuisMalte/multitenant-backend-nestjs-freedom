import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
// CORRECCIÓN APLICADA: Importando el cliente exclusivo de Tenants, no el de Master.
import { PrismaClient } from '../../../generated/tenant-client';


import { PrismaPg } from '@prisma/adapter-pg';
import { TenantDatabaseConfig } from './tenant-database.config';

/**
 * Representa una entrada en el caché de conexiones.
 * Almacena la instancia de Prisma y el timestamp de su última actividad.
 */
interface TenantClientEntry {
  client: PrismaClient;
  lastUsedAt: number;
}

/**
 * Gestor centralizado de conexiones Multi-Tenant.
 *
 * Implementa el patrón "Database per Tenant" mediante un caché en memoria
 * de instancias PrismaClient reutilizables. Garantiza que cada tenant
 * mantenga como máximo una instancia activa dentro de este proceso,
 * previniendo el agotamiento del pool de conexiones de PostgreSQL.
 *
 * Las conexiones inactivas se cierran y eliminan después del TTL configurado.
 */
@Injectable()
export class TenantConnectionManager
  implements OnModuleInit, OnModuleDestroy
{
  /** Diccionario en memoria RAM. Llave: TenantId, Valor: Entrada de cliente */
  private readonly clients = new Map<string, TenantClientEntry>();

  /** Referencia al temporizador de limpieza para poder destruirlo al apagar */
  private cleanupInterval?: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  /**
   * Hook de ciclo de vida de NestJS.
   * Se ejecuta una vez cuando el módulo se inicializa.
   * Configura el bucle periódico que barre la memoria buscando conexiones inactivas.
   */
  onModuleInit(): void {
    const ttlMs = this.configService.getOrThrow<number>(
      'tenancy.connectionTtlMs',
    );

    this.cleanupInterval = setInterval(() => {
      void this.removeExpiredClients(ttlMs);
    }, ttlMs);

    this.logger.log(
      { ttlMs },
      'Tenant connection manager initialized',
    );
  }

  /**
   * Obtiene el PrismaClient asociado al tenant.
   * 
   * @param tenantId Identificador único del tenant en la Master DB.
   * @param config Credenciales físicas para conectarse a la base de datos del tenant.
   * @returns Instancia activa de PrismaClient conectada a la BD del tenant.
   */
  getClient(
    tenantId: string,
    config: TenantDatabaseConfig,
  ): PrismaClient {
    const existingEntry = this.clients.get(tenantId);

    // Caché Hit: Si existe, renueva el tiempo de vida (TTL) y reutiliza la conexión.
    if (existingEntry) {
      existingEntry.lastUsedAt = Date.now();
      return existingEntry.client;
    }

    // Caché Miss: Si no existe, crea una nueva conexión, la registra y la devuelve.
    const client = this.createClient(config);

    this.clients.set(tenantId, {
      client,
      lastUsedAt: Date.now(),
    });

    this.logger.log(
      { tenantId, databaseName: config.name },
      'Tenant PrismaClient created',
    );

    return client;
  }

  /**
   * Construye un PrismaClient apuntando exclusivamente
   * a la base de datos PostgreSQL física del tenant utilizando el driver nativo (pg).
   */
  private createClient(
    config: TenantDatabaseConfig,
  ): PrismaClient {
    const connectionString =
      `postgresql://${config.user}:${config.password}` +
      `@${config.host}:${config.port}/${config.name}`;

    const adapter = new PrismaPg({
      connectionString,
    });

    return new PrismaClient({ adapter });
  }

  /**
   * Escanea el caché en busca de clientes que hayan superado el tiempo máximo de inactividad.
   * 
   * @param ttlMs Tiempo de vida en milisegundos.
   */
  private async removeExpiredClients(
    ttlMs: number,
  ): Promise<void> {
    const now = Date.now();

    for (const [tenantId, entry] of this.clients.entries()) {
      const inactiveTime = now - entry.lastUsedAt;

      // Si aún no vence el TTL, pasa al siguiente tenant
      if (inactiveTime < ttlMs) {
        continue;
      }

      // Si venció, procede con la desconexión
      await this.disconnectClient(tenantId, entry);
    }
  }

  /**
   * Cierra ordenadamente la conexión TCP con PostgreSQL y elimina el registro de la memoria RAM.
   */
  private async disconnectClient(
    tenantId: string,
    entry: TenantClientEntry,
  ): Promise<void> {
    try {
      await entry.client.$disconnect();

      this.logger.log(
        { tenantId },
        'Tenant PrismaClient disconnected',
      );
    } catch (error) {
      this.logger.error(
        { err: error, tenantId },
        'Failed to disconnect tenant PrismaClient',
      );
    } finally {
      // Se elimina del Map sin importar si $disconnect falló, para evitar clientes zombis
      this.clients.delete(tenantId);
    }
  }

  /**
   * Hook de ciclo de vida de NestJS.
   * Se ejecuta durante el apagado de la aplicación (SIGTERM/SIGINT).
   * Garantiza que no queden conexiones fantasma abiertas en la base de datos.
   */
  async onModuleDestroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Ejecuta la desconexión de todos los clientes activos en paralelo
    const disconnectOperations = Array.from(
      this.clients.entries(),
    ).map(([tenantId, entry]) =>
      this.disconnectClient(tenantId, entry),
    );

    await Promise.all(disconnectOperations);

    this.logger.log('Tenant connection manager destroyed');
  }
}