import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateReservationDto {
  @IsDateString()
  date!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  status!: string;

  @IsUUID()
  customerId!: string;

  @IsUUID()
  courtId!: string;
}