import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

/**
 * Data Transfer Object (DTO) para la creación de usuarios del Tenant.
 * Define el contrato estricto de entrada de datos, previniendo ataques de inyección y asignación masiva.
 */
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
  
  // IMPORTANTE: El campo 'role' se omite deliberadamente aquí.
}