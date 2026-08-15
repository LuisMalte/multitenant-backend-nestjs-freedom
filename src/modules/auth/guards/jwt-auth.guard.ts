import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guardián de Autenticación JWT.
 * Actúa como un interceptor a nivel de ruta o controlador.
 * Hereda toda la lógica de validación del motor de Passport asociado a la estrategia 'jwt'.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}