import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const tenantClients = new Map<string, PrismaClient>();

function getTenantClient(
  tenantId: string,
  connectionString: string,
): PrismaClient {
  const existingClient = tenantClients.get(tenantId);

  if (existingClient) {
    return existingClient;
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  const client = new PrismaClient({
    adapter,
  });

  tenantClients.set(tenantId, client);

  return client;
}

async function main() {
  const connectionString =
    'postgresql://postgres:postgres@localhost:5432/courtreserve_tenant_demo';

  const client1 = getTenantClient(
    'tenant-demo',
    connectionString,
  );

  const client2 = getTenantClient(
    'tenant-demo',
    connectionString,
  );

  console.log('Same PrismaClient:', client1 === client2);

  await client1.$connect();

  console.log('Tenant DB connected');

  await client1.$disconnect();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });