import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration, validate } from './infrastructure/config';
import { LoggerModule } from './infrastructure/logger';
import { FilterModule } from './common/filters';
import { DatabaseModule } from './infrastructure/database';
import { TenantGuard } from './common/guards';
import { TenancyModule } from './common/tenancy';
import { TenantsModule } from './modules/tenants/tenants.module';
import { TenantClientController } from './test/tenant-client.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
/**
 * Módulo raíz de la aplicación.
 * Orquesta la configuración global y el árbol de dependencias inicial.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,        // Hace el módulo accesible globalmente.
      cache: true,           // Cachea las variables en memoria para optimizar rendimiento.
      expandVariables: true, // Permite interpolación de variables en los .env.
      load: [configuration], // Inyecta el objeto de configuración base.
      validate,              // Ejecuta la validación estricta (fail-fast) en el arranque.
      
    }
    
  ),


    LoggerModule,
    FilterModule,
    DatabaseModule,
    TenancyModule,
    TenantsModule,
    AuthModule,
    UsersModule,
    CustomersModule,
  ],

  controllers: [TenantClientController],
 providers: [TenantGuard],


 
})
export class AppModule {}