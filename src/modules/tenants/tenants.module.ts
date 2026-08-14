import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
//Módulo que encapsula la funcionalidad relacionada con los tenants, incluyendo el controlador y el servicio correspondiente.
@Module({
  controllers: [TenantsController],
  providers: [TenantsService],
})
export class TenantsModule {}