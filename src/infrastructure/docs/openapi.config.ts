import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';

/**
 * Genera la especificación OpenAPI a partir de los controllers
 * registrados en la aplicación NestJS.
 *
 * @nestjs/swagger se utiliza únicamente como generador de la
 * especificación OpenAPI. La interfaz de documentación será Scalar.
 */
export function createOpenApiDocument(
  app: INestApplication,
  configService: ConfigService,
): OpenAPIObject {
  const appName = configService.getOrThrow<string>('app.name');

  const openApiConfig = new DocumentBuilder()
    .setTitle(appName)
    .setDescription(
      'CourtReserve REST API - Multi-Tenant Sports Court Reservation Platform',
    )
    .setVersion('1.0.0')
    .build();

  return SwaggerModule.createDocument(app, openApiConfig);
}