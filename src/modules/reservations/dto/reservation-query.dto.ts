import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { PaginationDto } from '../../../common/dtos';

export class ReservationQueryDto extends PaginationDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  courtId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  status?: string;

  @IsOptional()
  @IsIn([
    'date',
    'startTime',
    'endTime',
    'status',
    'createdAt',
    'updatedAt',
  ])
  sortBy = 'createdAt';
}