import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
//dto para la creación de un nuevo tenant, con validaciones de los campos name y slug
export class CreateTenantDto {
  //name debe ser una cadena de texto no vacía, con longitud entre 2 y 255 caracteres  
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  name!: string;
  //slug debe ser único, contener solo letras minúsculas, números y guiones, y tener entre 2 y 255 caracteres   
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'slug must contain only lowercase letters, numbers, and hyphens',
  })
  //slug debe ser único, contener solo letras minúsculas, números y guiones, y tener entre 2 y 255 caracteres
  slug!: string;
}