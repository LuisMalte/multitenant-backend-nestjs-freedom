import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { hash } from 'bcrypt';
import type { Request } from 'express';

import { TenantContextService } from '../../common/tenancy';
import { CreateUserDto } from './dto/create-user.dto';

/**
 * Servicio encargado de la lógica de negocio para la gestión de usuarios.
 * Opera EXCLUSIVAMENTE sobre la base de datos física del tenant inyectado en la petición.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly logger: Logger,
  ) {}

  /**
   * Crea un nuevo usuario dentro del tenant actual.
   * 
   * @param request - El contexto HTTP de Express que contiene el ID del tenant validado.
   * @param dto - Los datos validados del usuario a crear.
   * @returns El objeto del usuario creado (excluyendo datos sensibles).
   */
  async create(request: Request, dto: CreateUserDto) {
    // 1. Resolución Dinámica de Conexión: Obtiene el PrismaClient que apunta a la BD del tenant.
    const client = this.tenantContextService.getClient(request);

    // 2. Validación de regla de negocio: Unicidad del correo dentro de ESTE tenant.
    const existingUser = await client.user.findUnique({
      where: {
        email: dto.email,
      },
      select: {
        id: true, // Optimización de memoria: Solo traemos el ID si existe.
      },
    });

    if (existingUser) {
      throw new ConflictException('User email already exists');
    }

    // 3. Criptografía unidireccional (Hashing)
    const passwordHash = await hash(dto.password, 10);

    // 4. Inserción segura y proyección de datos
    const user = await client.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: passwordHash,
        role: 'USER', // Hardcodeo por seguridad: Todo nuevo registro es un usuario raso.
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        deletedAt: true,
        // IMPORTANTE: 'password' no está en el select.
      },
    });

    // 5. Trazabilidad de la operación
    this.logger.log(
      {
        tenantId: request.tenant?.id,
        userId: user.id,
      },
      'Tenant user created',
    );

    return user;
  }

  /**
   * Método de utilidad interna, vital para el futuro módulo de Autenticación.
   */
  async findByEmail(request: Request, email: string) {
    const client = this.tenantContextService.getClient(request);

    return client.user.findUnique({
      where: {
        email,
      },
    });
  }
}