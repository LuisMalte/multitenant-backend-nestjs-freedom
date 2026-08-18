import { IsEnum, IsNotEmpty } from 'class-validator';

import { TenantStatus } from '../../../../generated/master/prisma/client';

/**
 * Data Transfer Object (DTO) para la actualización de estado de un Tenant.
 * o desactivar el acceso de una organización completa a la plataforma SaaS, 
 * afectando directamente la evaluación del `TenantGuard`.
 */
export class UpdateTenantStatusDto {
  /**
   * El nuevo estado operativo del tenant.
   * Es estrictamente obligatorio y debe coincidir con los valores 
   * definidos en el enumerador de la Master Database.
   * * @example "INACTIVE"
   */
  @IsNotEmpty()
  @IsEnum(TenantStatus)
  status!: TenantStatus;
}