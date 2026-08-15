import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/database/prisma.service';
import { PostgresProvisioningService } from './../src/infrastructure/database/postgres-provisioning.service';
import { ConflictException, Injectable, } from '@nestjs/common';

interface CreatedTenant {
  id: string;
  databaseName: string;
}

describe('Tenant multi-tenancy (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let postgresProvisioningService: PostgresProvisioningService;

  const createdTenants: CreatedTenant[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('api/v1');

    prismaService = app.get(PrismaService);
    postgresProvisioningService = app.get(
      PostgresProvisioningService,
    );

    await app.init();
  });

  it('should isolate requests between two tenants', async () => {
    const testSuffix = Date.now();

    const tenantAResponse = await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send({
        name: 'E2E Tenant A',
        slug: `e2e-tenant-a-${testSuffix}`,
      })
      .expect(201);

    const tenantBResponse = await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send({
        name: 'E2E Tenant B',
        slug: `e2e-tenant-b-${testSuffix}`,
      })
      .expect(201);

    const tenantA: CreatedTenant = {
      id: tenantAResponse.body.id,
      databaseName: tenantAResponse.body.databaseName,
    };

    const tenantB: CreatedTenant = {
      id: tenantBResponse.body.id,
      databaseName: tenantBResponse.body.databaseName,
    };

    createdTenants.push(tenantA, tenantB);

    expect(tenantA.id).not.toBe(tenantB.id);
    expect(tenantA.databaseName).not.toBe(tenantB.databaseName);

    const tenantAResponseDatabase = await request(
      app.getHttpServer(),
    )
      .get('/api/v1/test/tenant-client')
      .set('X-Tenant-Id', tenantA.id)
      .expect(200);

    const tenantBResponseDatabase = await request(
      app.getHttpServer(),
    )
      .get('/api/v1/test/tenant-client')
      .set('X-Tenant-Id', tenantB.id)
      .expect(200);

    expect(tenantAResponseDatabase.body).toEqual({
      database: tenantA.databaseName,
    });

    expect(tenantBResponseDatabase.body).toEqual({
      database: tenantB.databaseName,
    });

    expect(tenantAResponseDatabase.body.database).not.toBe(
      tenantBResponseDatabase.body.database,
    );
  });

  afterAll(async () => {
    for (const tenant of createdTenants) {
      await postgresProvisioningService.dropDatabase(
        tenant.databaseName,
      );

      await prismaService.tenant.delete({
        where: {
          id: tenant.id,
        },
      });
    }

    await app.close();
  });

    it('should reject duplicated tenant slugs', async () => {
    const slug = `e2e-duplicate-${Date.now()}`;

    const firstResponse = await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send({
        name: 'E2E Duplicate Tenant',
        slug,
      })
      .expect(201);

    const tenantId = firstResponse.body.id;
    const databaseName = firstResponse.body.databaseName;

    try {
      const duplicateResponse = await request(app.getHttpServer())
        .post('/api/v1/tenants')
        .send({
          name: 'E2E Duplicate Tenant',
          slug,
        })
        .expect(409);

      expect(duplicateResponse.body).toEqual(
        expect.objectContaining({
          success: false,
          statusCode: 409,
          path: '/api/v1/tenants',
          message: 'Tenant slug already exists',
        }),
      );

      expect(duplicateResponse.body.databasePassword).toBeUndefined();

      const tenantsWithSlug = await prismaService.tenant.findMany({
        where: {
          slug,
        },
      });

      expect(tenantsWithSlug).toHaveLength(1);
      expect(tenantsWithSlug[0].id).toBe(tenantId);
      expect(tenantsWithSlug[0].databaseName).toBe(databaseName);
    } finally {
      await postgresProvisioningService.dropDatabase(databaseName);

      await prismaService.tenant.delete({
        where: {
          id: tenantId,
        },
      });
    }
  });
});