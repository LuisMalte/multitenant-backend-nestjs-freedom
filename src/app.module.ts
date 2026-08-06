import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration, validate } from './infrastructure/config';

/**
 * Módulo raíz de la aplicación.
 * Orquesta la configuración global y el árbol de dependencias inicial.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,        // Hace el módulo accesible globalmente.
      cache: true,           // Cachea las variables en memoria para optimizar rendimiento.
      expandVariables: true, // Permite interpolación de variables en los .env.
      load: [configuration], // Inyecta el objeto de configuración base.
      validate,              // Ejecuta la validación estricta (fail-fast) en el arranque.
    }),
  ],
 
})
export class AppModule {}