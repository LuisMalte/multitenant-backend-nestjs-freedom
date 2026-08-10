import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../infrastructure/database/prisma.service';

/**
 * Guardia de seguridad que intercepta las peticiones HTTP para validar
 * la identidad y el estado de la cuenta del cliente (tenant) antes de 
 * permitir el acceso a la aplicación.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  /**
   * @param prismaService - Servicio para consultar la base de datos maestra.
   */
  constructor(
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Evalúa la petición HTTP entrante y decide si puede continuar o debe ser bloqueada.
   *
   * @param {ExecutionContext} context - El contexto de la petición actual proporcionado por NestJS.
   * @returns {Promise<boolean>} Retorna `true` si el cliente está validado y autorizado.
   * @throws {UnauthorizedException} Si falta la credencial, el formato es incorrecto o la cuenta está inactiva.
   * @throws {NotFoundException} Si la credencial no existe en los registros de la base de datos maestra.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1Obtiene el paquete completo de la petición web entrante
    const request = context.switchToHttp().getRequest<Request>();

    // Extrae el identificador del cliente desde las cabeceras HTTP
    const tenantId = request.headers['x-tenant-id'];

    // Verifica que la credencial haya sido enviada y sea un texto simple
    if (!tenantId || Array.isArray(tenantId)) {
      throw new UnauthorizedException('Tenant ID is required');
    }

    // Consulta el archivo maestro para verificar si el cliente existe
    const tenant = await this.prismaService.tenant.findUnique({
      where: {
        id: tenantId,
      },
    });

    // Deniega el acceso si el identificador no pertenece a ningún cliente registrado
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Deniega el acceso si el cliente tiene un estado diferente a "Activo"
    if (tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tenant is not active');
    }

  

    /**
     * Mutación del ciclo de vida HTTP (Propagación de estado).
     * Inyecta el registro validado del tenant en el objeto Request de Express.
     * 
     * Propósito: Proveer al TenantConnectionManager las credenciales exactas 
     * directamente desde la memoria RAM, erradicando la necesidad de realizar 
     * consultas redundantes a la Master DB.
     */
    request.tenant = tenant;


    // Otorga luz verde para que la petición ingrese al sistema
    return true;

  }
}