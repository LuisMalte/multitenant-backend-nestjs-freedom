import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

interface TenantDatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}

@Injectable()
export class TenantConnectionManager {
  private readonly clients = new Map<string, PrismaClient>();

  getClient(
    tenantId: string,
    config: TenantDatabaseConfig,
  ): PrismaClient {
    const existingClient = this.clients.get(tenantId);

    if (existingClient) {
      return existingClient;
    }

    const client = this.createClient(config);

    this.clients.set(tenantId, client);

    return client;
  }

  private createClient(
    config: TenantDatabaseConfig,
  ): PrismaClient {
    const connectionString =
      `postgresql://${config.user}:${config.password}` +
      `@${config.host}:${config.port}/${config.name}`;

    const adapter = new PrismaPg({
      connectionString,
    });

    return new PrismaClient({
      adapter,
    });
  }
}