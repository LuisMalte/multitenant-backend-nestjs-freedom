import {
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { TenantStatus } from '../../../../generated/master/prisma/client';
import { PaginationDto } from '../../../common/dtos';

/**
 * Data Transfer Object (DTO) para la consulta, filtrado y paginación de Tenants.
 * * Se utiliza en el controlador maestro para estandarizar los parámetros de búsqueda
 * al listar las organizaciones registradas en la plataforma SaaS. Hereda las 
 * propiedades base de paginación (`page`, `limit`, `order`) de `PaginationDto`.
 */
export class TenantQueryDto extends PaginationDto {
  /**
   * Filtra los tenants cuyo nombre contenga esta cadena de texto (búsqueda parcial).
   * @example "Club Deportivo"
   */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  /**
   * Filtra los tenants por su identificador amigable en la URL.
   * @example "club-deportivo-cali"
   */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  /**
   * Filtra los tenants según su estado operativo actual.
   * Valida estrictamente contra el enumerador nativo de Prisma.
   * @example "ACTIVE"
   */
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  /**
   * Determina la columna por la cual se ordenarán los resultados.
   * Actúa como una lista blanca (whitelist) para prevenir que se expongan 
   * u ordenen columnas de infraestructura sensibles (ej. databaseName, databasePassword).
   * @default 'createdAt'
   */
  @IsOptional()
  @IsIn([
    'name',
    'slug',
    'status',
    'createdAt',
    'updatedAt',
  ])
  sortBy = 'createdAt';
}