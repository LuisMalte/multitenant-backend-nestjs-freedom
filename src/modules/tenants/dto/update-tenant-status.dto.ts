import { IsEnum, IsNotEmpty } from 'class-validator';

import { TenantStatus } from '../../../../generated/master/prisma/client';

export class UpdateTenantStatusDto {
  @IsNotEmpty()
  @IsEnum(TenantStatus)
  status!: TenantStatus;
}