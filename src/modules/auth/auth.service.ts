import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import type { Request } from 'express';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

/**
 * Servicio encargado exclusivamente de la verificación de credenciales
 * y la emisión de tokens JWT criptográficos.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Verifica la identidad del usuario y emite un token ligado a su tenant.
   */
  async login(
    request: Request,
    dto: LoginDto,
  ) {
    // 1. Búsqueda cruzada en la base de datos del tenant
    const user = await this.usersService.findByEmail(
      request,
      dto.email,
    );

    // 2. Prevención de enumeración y validación de borrado lógico
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Verificación criptográfica de la contraseña
    const passwordMatches = await compare(
      dto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. Construcción del Payload con Ancla de Aislamiento
    const payload = {
      sub: user.id,
      tenantId: request.tenant!.id, // <- El token queda físicamente atado a este tenant
      role: user.role,
    };

    // 5. Firma del token
    const accessToken = await this.jwtService.signAsync(
      payload,
    );

    // No se expone el usuario ni la contraseña, solo el token de acceso
    return {
      accessToken,
    };
  }
}