import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';

// Convierte una función basada en callbacks tradicionales en una basada en Promesas (async/await)
const execFileAsync = promisify(execFile);

@Injectable()
export class TenantMigrationService {
  constructor(private readonly logger: Logger) {}

  async migrate(databaseUrl: string): Promise<void> {
    // Localiza dinámicamente el ejecutable de Prisma CLI dentro de node_modules/.bin,
    // adaptándose automáticamente al sistema operativo (Windows usa .cmd, Linux/macOS no).
    const prismaCli = join(
      process.cwd(),
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'prisma.cmd' : 'prisma',
    );

    try {
      this.logger.log('Applying tenant database migrations');

      // Ejecuta el comando de terminal de forma asíncrona.
      // Se utiliza 'migrate deploy' para aplicar migraciones existentes de forma determinista,
      // apuntando al archivo de configuración aislado del tenant.
      await execFileAsync(
        prismaCli,
        [
          'migrate',
          'deploy',
          '--config=prisma/tenant/prisma.config.ts',
        ],
        {
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

      this.logger.log('Tenant database migrations applied successfully');
    } catch (error) {
      this.logger.error(
        { err: error },
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