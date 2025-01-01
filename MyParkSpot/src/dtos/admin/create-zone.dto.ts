import { IsString, IsOptional, IsNumber, Min, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateZoneDto {
  @IsString({ message: 'Zone name must be a string.' })
  name: string;

  @IsString({ message: 'Zone name must be a string.' })
  @Length(1, 20, { message: 'Zone type must be between 1 and 20 characters.' })
  type: string;

  @IsNumber({}, { message: 'Base Cost must be a number.' })
  @Type(() => Number)
  @Min(0, { message: 'Base Cost cannot be negative.' })
  baseCost: number;

  @IsOptional()
  @IsNumber({}, { message: 'Max Parking Duration must be a number.' })
  @Type(() => Number)
  @Min(0, { message: 'Max Parking Duration cannot be negative.' })
  maxParkingDuration?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Max Extension Duration must be a number.' })
  @Type(() => Number)
  @Min(0, { message: 'Max Extension Duration cannot be negative.' })
  maxExtensionDuration?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Extension Cost must be a number.' })
  @Type(() => Number)
  @Min(0, { message: 'Extension Cost cannot be negative.' })
  extensionCost?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Daily Pass Cost must be a number.' })
  @Type(() => Number)
  @Min(0, { message: 'Daily Pass Cost cannot be negative.' })
  dailyPassCost?: number;
}
