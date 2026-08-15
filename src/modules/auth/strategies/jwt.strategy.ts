import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

/**
 * Define la estructura de datos que se espera encontrar dentro del token JWT una vez desencriptado.
 */
interface JwtPayload {
  sub: string;       // Identificador único del usuario (Subject).
  tenantId: string;  // Identificador de la base de datos (Tenant) a la que pertenece el usuario.
  role: string;      // Nivel de privilegios dentro del sistema.
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    // Llama al constructor de la clase padre (PassportStrategy) para inicializar las reglas del motor criptográfico.
    super({
      // Instrucción estricta: El token solo será aceptado si viene en el header 'Authorization' con el prefijo 'Bearer'.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Llave criptográfica simétrica usada para verificar que el token no ha sido manipulado.
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
      // Directiva clave: Obliga a Passport a pasar el objeto Request de Express al método validate().
      passReqToCallback: true, 
    });
  }

  /**
   * Método ejecutado automáticamente por Passport SOLO SI el token superó la validación criptográfica y no ha expirado.
   * 
   * @param request - El objeto HTTP Request de Express que contiene el contexto de la petición.
   * @param payload - El contenido JSON descifrado del token.
   * @returns El payload validado, que NestJS inyectará automáticamente en request.user.
   */
  validate(request: Request, payload: JwtPayload): JwtPayload {
    // Recupera el contexto del tenant inyectado previamente en la capa de Middleware/Guard.
    const tenant = request.tenant;

    //  Control de fallo estructural: Si la petición llegó aquí sin un tenant asignado, hay un fallo de ruteo.
    if (!tenant) {
      throw new UnauthorizedException('Tenant context not available');
    }

    // Regla de Aislamiento Multi-Tenant (Cross-Tenant Bypass Prevention).
    // Compara el origen del usuario (token) con el destino de la petición (url/header).
    if (payload.tenantId !== tenant.id) {
      throw new UnauthorizedException('JWT tenant mismatch');
    }

    return payload;
  }
}