import { Tenant } from '../../../generated/master/prisma/client';


declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }
  }
}

export {};