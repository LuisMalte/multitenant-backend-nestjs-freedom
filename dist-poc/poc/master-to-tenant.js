"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../generated/prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const tenant_connection_manager_1 = require("../src/infrastructure/database/tenant-connection.manager");
const masterConnectionString = 'postgresql://postgres:postgres@localhost:5432/courtreserve_master';
const masterAdapter = new adapter_pg_1.PrismaPg({
    connectionString: masterConnectionString,
});
const masterClient = new client_1.PrismaClient({
    adapter: masterAdapter,
});
const tenantConnectionManager = new tenant_connection_manager_1.TenantConnectionManager();
async function main() {
    // 1. Buscar el tenant en la Master DB
    const tenant = await masterClient.tenant.findUnique({
        where: {
            slug: 'tenant-demo',
        },
    });
    if (!tenant) {
        throw new Error('Tenant not found');
    }
    console.log('Tenant resolved from Master DB:');
    console.log(tenant);
    // 2. Construir la configuración del tenant
    const tenantConfig = {
        host: tenant.databaseHost,
        port: tenant.databasePort,
        name: tenant.databaseName,
        user: tenant.databaseUser,
        password: tenant.databasePassword,
    };
    // 3. Obtener el PrismaClient del TenantConnectionManager
    const tenantClient1 = tenantConnectionManager.getClient(tenant.id, tenantConfig);
    const tenantClient2 = tenantConnectionManager.getClient(tenant.id, tenantConfig);
    console.log('Same PrismaClient:', tenantClient1 === tenantClient2);
    await tenantClient1.$connect();
    console.log('Tenant DB connected');
    // 4. Comprobar que podemos conectarnos a la DB del tenant
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await masterClient.$disconnect();
});
