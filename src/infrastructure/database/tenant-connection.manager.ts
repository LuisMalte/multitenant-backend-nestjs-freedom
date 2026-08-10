import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { TenantDatabaseConfig } from './tenant-database.config';

/**
 * Gestor centralizado de conexiones Multi-Tenant ("Database per Tenant").
 * 
 * Responsabilidad Única:
 * Administrar un caché en memoria RAM mediante un Map para reutilizar las instancias 
 * de PrismaClient existentes por cada tenant, evitando la saturación de conexiones 
 * a PostgreSQL y garantizando la persistencia aislada por cliente.
 */
@Injectable()
export class TenantConnectionManager {
  /** 
   * Caché en memoria que almacena las instancias activas de PrismaClient indexadas por el ID del tenant.
   * Estructura: Map<TenantId, PrismaClientInstance>
   */
  private readonly clients = new Map<string, PrismaClient>();

  /**
   * Obtiene una instancia activa de PrismaClient para un tenant específico.
   * Si la conexión ya existe en caché, la reutiliza; de lo contrario, la instancia bajo demanda.
   * 
   * 
   */
  getClient(
    tenantId: string,
    config: TenantDatabaseConfig,
  ): PrismaClient {
    const existingClient = this.clients.get(tenantId);

    // Retorna la conexión existente si ya fue inicializada previamente (Patrón Singleton por Tenant)
    if (existingClient) {
      return existingClient;
    }

    // Si no existe, genera una nueva conexión y la registra en el caché
    const client = this.createClient(config);
    this.clients.set(tenantId, client);

    return client;
  }

  /**
   * Método de fábrica privado para construir y configurar una nueva instancia de PrismaClient.
   * Utiliza el adaptador nativo de PostgreSQL para Prisma.
   * 
   */
  private createClient(
    config: TenantDatabaseConfig,
  ): PrismaClient {
    // Construcción de la URI de conexión estándar para PostgreSQL
    const connectionString =
      `postgresql://${config.user}:${config.password}` +
      `@${config.host}:${config.port}/${config.name}`;

    // Inicialización del adaptador de PostgreSQL para Prisma
    const adapter = new PrismaPg({
      connectionString,
    });

    // Instanciación del cliente ORM con el adaptador dinámico configurado
    return new PrismaClient({
      adapter,
    });
  }
}