import { Tenant } from '../../../generated/master/prisma/client';

//utiliza la interfaz AuthenticatedUser para tipar el objeto request.user en Express, asegurando 
// que contenga sub, tenantId y role.
interface AuthenticatedUser {
  sub: string;
  tenantId: string;
  role: string;
}


// Extiende la interfaz Request de Express para incluir propiedades específicas del contexto multitenant.
declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}

    interface Request {
      tenant?: Tenant;
    }
  }
}

export {};