import {
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';

/**
 * Data Transfer Object para la autenticación.
 * Establece el contrato estricto de los datos requeridos para iniciar sesión.
 */
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}