import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const connectionString =
  'postgresql://postgres:postgres@localhost:5432/courtreserve_master';

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo Tenant',
      slug: 'tenant-demo',
      databaseName: 'courtreserve_tenant_demo',
      databaseHost: 'localhost',
      databasePort: 5432,
      databaseUser: 'postgres',
      databasePassword: 'postgres',
      status: 'ACTIVE',
    },
  });

  console.log('Tenant created:');
  console.log(tenant);

  const foundTenant = await prisma.tenant.findUnique({
    where: {
      slug: 'tenant-demo',
    },
  });

  console.log('Tenant found:');
  console.log(foundTenant);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });