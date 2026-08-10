import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TenantGuard } from './tenant.guard';

@Controller('test/tenant')
export class TenantTestController {
  @Get()
  @UseGuards(TenantGuard)
  getTenant(@Req() request: Request) {
    return {
      message: 'Tenant resolved successfully',
      tenantId: request.headers['x-tenant-id'],
    };
  }
}

