import { PartialType } from '@nestjs/swagger';
import { CreateCourtDto } from './create-court.dto';

// clase DTO (Data Transfer Object) para la actualización de canchas. Esta clase extiende la clase CreateCourtDto utilizando PartialType, lo que permite que todas las propiedades de CreateCourtDto sean opcionales en UpdateCourtDto. Esto es útil para actualizar solo ciertos campos de una cancha existente sin requerir todos los datos.
export class UpdateCourtDto extends PartialType(CreateCourtDto) {}