import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { PrismaClient } from '../../../generated/prisma/client';
import { TenantConnectionManager } from '../../infrastructure/database';

@Injectable()
export class TenantContextService {
  constructor(
    private readonly connectionManager: TenantConnectionManager,
  ) {}

  getTenant(request: Request) {
    const tenant = request.tenant;

    if (!tenant) {
      throw new UnauthorizedException('Tenant context not available');
    }

    return tenant;
  }

  getClient(request: Request): PrismaClient {
    const tenant = this.getTenant(request);

    return this.connectionManager.getClient(tenant.id, {
      host: tenant.databaseHost,
      port: tenant.databasePort,
      name: tenant.databaseName,
      user: tenant.databaseUser,
      password: tenant.databasePassword,
    });
  }
}