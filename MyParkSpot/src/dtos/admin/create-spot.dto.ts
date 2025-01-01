import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateSpotDto {
  @IsNotEmpty({ message: 'Latitude is required.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Latitude must be a number.' })
  latitude: number;

  @IsNotEmpty({ message: 'Longitude is required.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Longitude must be a number.' })
  longitude: number;

  @IsNotEmpty({ message: 'Zone ID is required.' })
  @IsUUID('4', { message: 'Zone ID must be a valid UUID.' })
  zoneId: string;

  @IsOptional()
  @IsBoolean({ message: 'isOccupied must be a boolean.' })
  isOccupied?: boolean = false;

  @IsOptional()
  @IsBoolean({ message: 'isDeleted must be a boolean.' })
  isDeleted?: boolean = false;
}
