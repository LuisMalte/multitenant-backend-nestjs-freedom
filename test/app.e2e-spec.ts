import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/infrastructure/database/prisma.service';
import { PostgresProvisioningService } from './../src/infrastructure/database/postgres-provisioning.service';

describe('Tenant onboarding (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let postgresProvisioningService: PostgresProvisioningService;

  let tenantId: string;
  let databaseName: string;

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
    postgresProvisioningService = app.get(PostgresProvisioningService);

    await app.init();
  });

  it('should create a tenant and resolve its physical database', async () => {
    const slug = `e2e-${Date.now()}`;

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .send({
        name: 'E2E Tenant',
        slug,
      })
      .expect(201);

    expect(createResponse.body).toEqual(
      expect.objectContaining({
        name: 'E2E Tenant',
        slug,
        status: 'ACTIVE',
      }),
    );

    expect(createResponse.body.databasePassword).toBeUndefined();

    tenantId = createResponse.body.id;
    databaseName = createResponse.body.databaseName;

    const tenantInMaster = await prismaService.tenant.findUnique({
      where: {
        id: tenantId,
      },
    });

    expect(tenantInMaster).not.toBeNull();
    expect(tenantInMaster?.databaseName).toBe(databaseName);

    const tenantDatabaseResponse = await request(app.getHttpServer())
      .get('/api/v1/test/tenant-client')
      .set('X-Tenant-Id', tenantId)
      .expect(200);

    expect(tenantDatabaseResponse.body).toEqual({
      database: databaseName,
    });
  });

  afterAll(async () => {
    if (databaseName) {
      await postgresProvisioningService.dropDatabase(databaseName);
    }

    if (tenantId) {
      await prismaService.tenant.delete({
        where: {
          id: tenantId,
        },
      });
    }

    await app.close();
  });
});