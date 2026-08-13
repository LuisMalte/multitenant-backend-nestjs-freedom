import { INestApplication } from '@nestjs/common';
import { apiReference } from '@scalar/nestjs-api-reference';
import type { OpenAPIObject } from '@nestjs/swagger';

/**
 * Registra Scalar como interfaz de documentación de la API.
 *
 * Scalar consume directamente la especificación OpenAPI generada
 * por la aplicación. No se habilita Swagger UI.
 */
export function configureScalar(
  app: INestApplication,
  document: OpenAPIObject,
): void {
  app.use(
    '/api/docs',
    apiReference({
      content: document,
    }),
  );
}