import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Módulo de Autenticación.
 * Encapsula la configuración del motor JWT y los mecanismos de protección de rutas.
 */
@Module({
  imports: [
    // Importa ConfigModule para tener acceso a las variables de entorno.
    ConfigModule,
    
    // Inicializa el motor subyacente de Passport.
    PassportModule,
    
    // Configura el generador/validador de tokens JWT de forma asíncrona.
    // Es asíncrono porque requiere leer el entorno antes de instanciarse.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService], // Inyecta el servicio de configuración en la fábrica.
      
      // Patrón Factory: Construye el objeto de configuración dinámicamente.
      useFactory: (configService: ConfigService) => ({
        // Extrae la firma criptográfica (falla inmediatamente si no existe).
        secret: configService.getOrThrow<string>('jwt.secret'),
        signOptions: {
          // Define el tiempo de vida del token (ej. '1h', '7d').
        expiresIn: configService.getOrThrow<string>('jwt.expiresIn') as StringValue,        },
      }),
    }),
  ],
  // Registra la estrategia y el guardián en el contenedor de Inyección de Dependencias.
  providers: [JwtStrategy, JwtAuthGuard],
  
  // Expone estas herramientas para que otros módulos (como Users o Courts) puedan usarlas.
  exports: [JwtModule, PassportModule, JwtAuthGuard],
})
export class AuthModule {}