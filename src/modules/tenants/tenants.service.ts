import {Injectable,ConflictException,NotFoundException,} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import {PostgresProvisioningService, TenantMigrationService,} from '../../infrastructure/database';
import { Prisma } from '../../../generated/master/prisma/client';

import {
  CreateTenantDto,
  TenantQueryDto,
  UpdateTenantStatusDto,
} from './dto';

@Injectable()
export class TenantsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly postgresProvisioningService: PostgresProvisioningService,
    private readonly tenantMigrationService: TenantMigrationService,
    private readonly logger: Logger,
  ) {}
 
  // se usa para crear un nuevo tenant, asegurando la unicidad del slug, aprovisionando la base de datos física y aplicando migraciones lógicas
  async create(dto: CreateTenantDto) {
    // Validación de Unicidad en la Base de Datos Master
    const existingTenant = await this.prismaService.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant slug already exists');
    }

    // Normalización del Nombre de la Base de Datos Física
    const databaseName = `courtreserve_tenant_${dto.slug.replace(/-/g, '_')}`;

    // Extracción segura de credenciales maestras
    const host = this.configService.getOrThrow<string>('database.master.host');
    const port = this.configService.getOrThrow<number>('database.master.port');
    const user = this.configService.getOrThrow<string>('database.master.user');
    const password = this.configService.getOrThrow<string>('database.master.password');

    // Construcción segura de la URL de conexión
    const databaseUrl =
      `postgresql://${encodeURIComponent(user)}:` +
      `${encodeURIComponent(password)}@` +
      `${host}:${port}/${databaseName}`;

    let databaseCreated = false;

    try {
      // Aprovisionamiento Físico
      await this.postgresProvisioningService.createDatabase(databaseName);
      databaseCreated = true;

      // Migración Lógica
      await this.tenantMigrationService.migrate(databaseUrl);

      // Registro Maestro utilizando la proyección segura
      const tenant = await this.prismaService.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          databaseName,
          databaseHost: host,
          databasePort: port,
          databaseUser: user,
          databasePassword: password,
          status: 'ACTIVE',
        },
        select: this.getTenantSelect(),
      });

      return tenant;
    } catch (error) {
      if (databaseCreated) {
        try {
          await this.postgresProvisioningService.dropDatabase(databaseName);
        } catch (rollbackError) {
          this.logger.error(
            { err: rollbackError, databaseName },
            'Tenant database rollback failed',
          );
        }
      }
      throw error;
    }
  }


  //se usa para listar tenants con filtros y paginación, devolviendo metadatos de paginación
  async findAll(query: TenantQueryDto) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where: Prisma.TenantWhereInput = {
      ...(query.name && {
        name: { contains: query.name, mode: 'insensitive' as const },
      }),
      ...(query.slug && {
        slug: { contains: query.slug, mode: 'insensitive' as const },
      }),
      ...(query.status && { status: query.status }),
    };

    const [tenants, total] = await Promise.all([
      this.prismaService.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy]: query.order },
        select: this.getTenantSelect(),
      }),
      this.prismaService.tenant.count({ where }),
    ]);

    return {
      data: tenants,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  // se usa para obtener un tenant específico por su ID, lanzando una excepción si no se encuentra
  async findOne(id: string) {
    const tenant = await this.prismaService.tenant.findUnique({
      where: { id },
      select: this.getTenantSelect(),
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }


  // se usa para actualizar el estado de un tenant, primero verificando su existencia y luego actualizando su estado en la base de datos
  async updateStatus(id: string, dto: UpdateTenantStatusDto) {
    await this.findOne(id);

    const tenant = await this.prismaService.tenant.update({
      where: { id },
      data: { status: dto.status },
      select: this.getTenantSelect(),
    });

    this.logger.log({ tenantId: id, status: dto.status }, 'Tenant status updated');

    return tenant;
  }

  /**
   * Centraliza la proyección de datos para omitir credenciales sensibles.
   */
  private getTenantSelect() {
    return {
      id: true,
      name: true,
      slug: true,
      databaseName: true,
      databaseHost: true,
      databasePort: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}