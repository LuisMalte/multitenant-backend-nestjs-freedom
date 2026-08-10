/** * 
 * Define la estructura de datos estricta requerida por el TenantConnectionManager 
 * para construir las cadenas de conexión y levantar instancias independientes de PrismaClient.
 */
export interface TenantDatabaseConfig {
  /** Dirección del host o contenedor Docker donde se aloja la base de datos del tenant. */
  host: string;
  
  /** Puerto de red en el que escucha el servidor PostgreSQL del tenant (ej. 5432). */
  port: number;
  
  /** Nombre físico de la base de datos asignada exclusivamente a este tenant. */
  name: string;
  
  /** Nombre de usuario con privilegios de acceso sobre la base de datos del tenant. */
  user: string;
  
  /** Contraseña de autenticación segura para el usuario de la base de datos del tenant. */
  password: string;
}