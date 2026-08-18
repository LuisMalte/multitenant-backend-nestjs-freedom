import { Injectable,ConflictException,NotFoundException,} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import {PostgresProvisioningService,TenantMigrationService,} from '../../infrastructure/database';
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

  async create(dto: CreateTenantDto) {
    // 1. Validación de Unicidad en la Base de Datos Master
    const existingTenant = await this.prismaService.tenant.findUnique({
      where: {
        slug: dto.slug,
      },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant slug already exists');
    }

    // 2. Normalización del Nombre de la Base de Datos Física
    // Reemplaza los guiones medios por guiones bajos para cumplir con la sintaxis de PostgreSQL.
    const databaseName = `courtreserve_tenant_${dto.slug.replace(
      /-/g,
      '_',
    )}`;

    // Extracción segura de credenciales maestras desde la configuración tipada del entorno.
    const host = this.configService.getOrThrow<string>('database.master.host');
    const port = this.configService.getOrThrow<number>('database.master.port');
    const user = this.configService.getOrThrow<string>('database.master.user');
    const password = this.configService.getOrThrow<string>('database.master.password');

    // 3. Construcción segura de la URL de conexión
    // encodeURIComponent previene fallos de sintaxis si las credenciales contienen caracteres especiales (ej: @, #, :).
    const databaseUrl =
      `postgresql://${encodeURIComponent(user)}:` +
      `${encodeURIComponent(password)}@` +
      `${host}:${port}/${databaseName}`;

    let databaseCreated = false;

    try {
      // 4. Aprovisionamiento Físico: Crea la base de datos vacía en el servidor PostgreSQL.
      await this.postgresProvisioningService.createDatabase(
        databaseName,
      );

      databaseCreated = true; // Activa la bandera de control de infraestructura física existente.

      // 5. Migración Lógica: Despliega las tablas de negocio en la nueva base de datos.
      await this.tenantMigrationService.migrate(databaseUrl);

      // 6. Registro Maestro: Persiste los metadatos del tenant en la Master DB.
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
        // Proyección de datos (Select): Excluye credenciales sensibles (como la contraseña) 
        // de la respuesta HTTP final por motivos estrictos de seguridad.
        select: this.getTenantSelect(),
      });

      return tenant;
    } catch (error) {
      // Rollback de Infraestructura: Si la creación física falló, intenta eliminar la base de datos
        if (databaseCreated) {
        try {
          // Si la creación de la base de datos fue exitosa pero ocurrió un error posterior, intenta eliminar la base de datos para evitar recursos huérfanos.
          await this.postgresProvisioningService.dropDatabase(databaseName);
        } catch (rollbackError) {
          // Registro estructurado del fallo de rollback para análisis interno
          this.logger.error(
            {
              err: rollbackError,
              databaseName,
            },
            'Tenant database rollback failed',
          );
        }
      }

      throw error;
    }
  }

  async findAll(query: TenantQueryDto) {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const where: Prisma.TenantWhereInput = {
      ...(query.name && {
        name: {
          contains: query.name,
          mode: 'insensitive' as const,
        },
      }),
      ...(query.slug && {
        slug: {
          contains: query.slug,
          mode: 'insensitive' as const,
        },
      }),
      ...(query.status && {
        status: query.status,
      }),
    };

    const [tenants, total] = await Promise.all([
      this.prismaService.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [query.sortBy]: query.order,
        },
        select: this.getTenantSelect(),
      }),
      this.prismaService.tenant.count({
        where,
      }),
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

  async findOne(id: string) {
    const tenant = await this.prismaService.tenant.findUnique({
      where: {
        id,
      },
      select: this.getTenantSelect(),
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async updateStatus(id: string, dto: UpdateTenantStatusDto) {
    await this.findOne(id); // Reutilizamos findOne para que lance 404 si no existe

    const tenant = await this.prismaService.tenant.update({
      where: {
        id,
      },
      data: {
        status: dto.status,
      },
      select: this.getTenantSelect(),
    });

    this.logger.log(
      { tenantId: id, status: dto.status },
      'Tenant status updated',
    );

    return tenant;
  }

  /**
   * Centraliza la proyección de datos para omitir credenciales sensibles
   * en todas las respuestas de los endpoints.
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