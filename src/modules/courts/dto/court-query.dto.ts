import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { PaginationDto } from '../../../common/dtos';

// clase DTO (Data Transfer Object) para consultas de canchas. Esta clase define la estructura y las reglas de validación para los parámetros de consulta utilizados al buscar canchas. Cada propiedad está decorada con decoradores de validación de la biblioteca 'class-validator' para garantizar que los datos de entrada cumplan con los criterios especificados antes de ser procesados en la aplicación.
export class CourtQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sport?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  status?: string;

  @IsOptional()
  @IsIn([
    'name',
    'sport',
    'pricePerHour',
    'status',
    'createdAt',
    'updatedAt',
  ])
  sortBy = 'createdAt';
}