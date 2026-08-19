import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';

// Convierte una función basada en callbacks tradicionales en una basada en Promesas (async/await)
const execAsync = promisify(exec);

@Injectable()
export class TenantMigrationService {
  constructor(private readonly logger: Logger) {}

  async migrate(databaseUrl: string): Promise<void> {
    // Calculamos la ruta exacta a la carpeta del Tenant.
    // Ahora que el Dockerfile está corregido, esta carpeta sí existirá en producción.
    const tenantPrismaDir = join(process.cwd(), 'prisma', 'tenant');

    try {
      this.logger.log('Applying tenant database migrations');

      // Ejecuta el comando de terminal de forma asíncrona.
      // Se utiliza 'migrate deploy' para aplicar migraciones existentes de forma determinista,
      // apuntando al archivo de configuración aislado del tenant.
      const { stdout, stderr } = await execAsync(
        'npx prisma migrate deploy',
        {
          cwd: tenantPrismaDir,
          env: {
            ...process.env,
            // Inyecta dinámicamente la URL de la base de datos recién creada 
            // sin modificar el archivo .env global del sistema.
            TENANT_DATABASE_URL: databaseUrl,
          },
          // Amplía el búfer de salida para prevenir errores si la CLI de Prisma genera logs extensos.
          maxBuffer: 10 * 1024 * 1024,
        },
      );

      this.logger.log({ stdout, stderr }, 'Tenant database migrations applied successfully');
    } catch (error:any) {
      console.error('🔥 CRITICAL MIGRATION ERROR:', error);

      this.logger.error(
        { 
          err: error.message || error,
          stdout: error.stdout, 
          stderr: error.stderr
        },
        'Failed to apply tenant database migrations',
      );

      // Encapsula cualquier fallo del sistema operativo o de Prisma 
      // en una excepción HTTP estándar y controlada para el cliente.
      throw new InternalServerErrorException(
        'Could not apply tenant database migrations',
      );
    }
  }
}