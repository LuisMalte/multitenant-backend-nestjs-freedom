import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';


// clase DTO (Data Transfer Object) para la creación de canchas. Esta clase define la estructura y las reglas de validación para los datos necesarios al crear una nueva cancha. Cada propiedad está decorada con decoradores de validación de la biblioteca 'class-validator' para garantizar que los datos de entrada cumplan con los criterios especificados antes de ser procesados en la aplicación.
export class CreateCourtDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sport!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerHour!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  status!: string;
}