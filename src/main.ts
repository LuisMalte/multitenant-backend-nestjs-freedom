import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

/**
 * Punto de entrada principal (bootstrap) de la aplicación.
 * Inicializa el framework, extrae las variables de configuración y levanta el servidor HTTP.
 */
async function bootstrap() {
  // Instancia el contenedor principal a partir del módulo raíz.
  const app = await NestFactory.create(AppModule);
  // Extrae el servicio de configuración del contenedor de dependencias.
  const configService = app.get(ConfigService);

  // Recupera las variables críticas. Falla de forma inmediata si no existen.
  const appName = configService.getOrThrow<string>('app.name');
  const port = configService.getOrThrow<number>('app.port');
  const environment =configService.getOrThrow<string>('app.environment');


// Abre el puerto de red y espera la confirmación del sistema operativo.
  await app.listen(port);

// Reporta la telemetría inicial en la salida estándar.
  console.log('----------------------------------------');
  console.log(`${appName} is running`);
  console.log(`Environment: ${environment}`);
  console.log(`URL: http://localhost:${port}`);
  console.log('----------------------------------------');
}
bootstrap();


