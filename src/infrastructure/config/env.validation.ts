//Librería para la serialización y transformación de objetos.
import { plainToInstance } from 'class-transformer';

//Librería para la validación de esquemas basada en decoradores.

import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  validateSync,
} from 'class-validator';


//Define de manera rígida los entornos de ejecución permitidos
enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

//Esquema de transferencia de datos (DTO) que establece el contrato
class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  APP_NAME!: string;

  @IsInt()
  @Min(1)
  APP_PORT!: number;

  @IsEnum(Environment)
  NODE_ENV!: Environment;

  @IsString()
  @IsNotEmpty()
  MASTER_DATABASE_HOST!: string;

  @IsInt()
  MASTER_DATABASE_PORT!: number;

  @IsString()
  @IsNotEmpty()
  MASTER_DATABASE_NAME!: string;

  @IsString()
  @IsNotEmpty()
  MASTER_DATABASE_USER!: string;

  @IsString()
  MASTER_DATABASE_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN!: string;

  @IsString()
  RESEND_API_KEY!: string;

  @IsString()
  LOG_LEVEL!: string;

  @IsInt()
  @Min(60000)
  TENANT_CONNECTION_TTL_MS!: number;

}

// función de entrada para auditar la configuración de la infraestructura.
export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    {
      enableImplicitConversion: true,
    },
  );

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}