import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

/**
 * Punto de entrada principal (bootstrap) de la aplicación.
 * Orquesta la inicialización del framework, inyecta la configuración, 
 * unifica el sistema de logs y levanta el servidor HTTP.
 */
async function bootstrap() {
  // Construye el contexto de la aplicación instanciando el módulo raíz.
  // Retiene logs iniciales hasta activar Pino
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  
  // Extrae servicios globales desde el contenedor de Inyección de Dependencias (DI).
  const configService = app.get(ConfigService);

  // Redirige todo el logging a Pino
  const logger = app.get(Logger);

  // Recupera variables críticas (fail-fast: aborta si no existen).
  const appName = configService.getOrThrow<string>('app.name');
  const port = configService.getOrThrow<number>('app.port');
  const environment = configService.getOrThrow<string>('app.environment');


  // Sobrescribe el logger nativo de NestJS para delegar todo 
  // el registro de eventos a la implementación unificada de Pino.
  app.useLogger(logger);

  // Inicializa el servidor HTTP y bloquea hasta que el puerto de red esté abierto.
  await app.listen(port);

  // Reporta el estado de arranque emitiendo telemetría estructurada.
  logger.log(
  {
    app: appName,
    environment,
    port,
    url: `http://localhost:${port}`,
  },
  'Application started successfully',
);


}

bootstrap();