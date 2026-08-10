import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class TenantContextService {
  getTenant(request: Request) {
    return request.tenant;
  }
}