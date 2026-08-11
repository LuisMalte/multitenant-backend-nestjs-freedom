import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { TenantGuard } from '../common/guards';
import { TenantContextService } from '../common/tenancy';

@Controller('test')
export class TenantClientController {
  constructor(
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get('tenant-client')
  @UseGuards(TenantGuard)
  async getTenantDatabase(@Req() request: Request) {
    const client = this.tenantContextService.getClient(request);

    const result = await client.$queryRaw<
      Array<{ current_database: string }>
    >`SELECT current_database()`;

    return {
      database: result[0]?.current_database,
    };
  }
}