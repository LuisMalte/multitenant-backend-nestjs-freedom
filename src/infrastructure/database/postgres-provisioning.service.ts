import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { Client } from 'pg';

/**
 * Servicio de infraestructura encargado exclusivamente del aprovisionamiento físico
 * de bases de datos PostgreSQL a nivel de clúster.
 * 
 * Este servicio no utiliza Prisma, ya que los ORM no están diseñados para ejecutar
 * comandos DDL administrativos (como CREATE DATABASE) fuera del contexto de una base
 * de datos existente.
 */
@Injectable()
export class PostgresProvisioningService {
  /**
   * @param configService - Proveedor tipado para extraer variables de entorno.
   * @param logger - Proveedor de observabilidad estructurada (Pino).
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  /**
   * Aplica una lista blanca (whitelist) estricta sobre el identificador de la base de datos.
   * Previene vectores de inyección SQL a nivel estructural.
   * 
   * @param databaseName - Nombre físico de la base de datos a evaluar.
   * @throws {BadRequestException} Si el nombre contiene caracteres no permitidos o no sigue el patrón.
   */
  private validateDatabaseName(databaseName: string): void {
    // Patrón: Debe empezar con 'courtreserve_tenant_' seguido únicamente de minúsculas, números o guiones bajos.
    const validDatabaseName = /^courtreserve_tenant_[a-z0-9_]+$/;

    if (!validDatabaseName.test(databaseName)) {
      this.logger.error(
        { databaseName },
        'Tenant database creation blocked: invalid database name',
      );

      throw new BadRequestException('Invalid tenant database name');
    }
  }

  /**
   * Establece una conexión administrativa al clúster y ejecuta la orden de creación.
   * 
   * @param databaseName - Nombre de la nueva base de datos del tenant.
   * @returns Promesa vacía que se resuelve si la creación física es exitosa.
   * @throws {InternalServerErrorException} Si las credenciales fallan o el clúster rechaza la operación.
   */
  async createDatabase(databaseName: string): Promise<void> {
    // 1. Barrera de seguridad innegociable
    this.validateDatabaseName(databaseName);

    // 2. Extracción de variables bajo el principio Fail-Fast (Falla rápido si no existen)
    const host = this.configService.getOrThrow<string>('database.master.host');
    const port = this.configService.getOrThrow<number>('database.master.port');
    const user = this.configService.getOrThrow<string>('database.master.user');
    const password = this.configService.getOrThrow<string>('database.master.password');

    // 3. Configuración del driver nativo apuntando a la base del sistema 'postgres'
    const client = new Client({
      host,
      port,
      user,
      password,
      database: 'postgres',
    });

    try {
      this.logger.log(
        { databaseName },
        'Creating tenant database',
      );

      // 4. Apertura del socket TCP/IP con el clúster
      await client.connect();

      // 5. Ejecución del comando DDL con interpolación (Segura gracias a la validación previa)
      await client.query(`CREATE DATABASE "${databaseName}"`);

      this.logger.log(
        { databaseName },
        'Tenant database created successfully',
      );
    } catch (error) {
      // 6. Registro estructurado del fallo real para análisis interno
      this.logger.error(
        {
          err: error,
          databaseName,
        },
        'Failed to create tenant database',
      );

      // 7. Lanzamiento de excepción genérica para proteger la infraestructura
      throw new InternalServerErrorException(
        'Could not create tenant database',
      );
    } finally {
      // 8. Liberación obligatoria de recursos del servidor
      await client.end();
    }
  }
}