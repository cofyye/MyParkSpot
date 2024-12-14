import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const currentYear = new Date().getFullYear();

export class RegisterCarDto {
  @IsString()
  @IsNotEmpty({ message: 'The user ID field must not be empty.' })
  public readonly userId: string;

  @IsString()
  @MaxLength(10, {
    message: 'The license plate field must contain a maximum of 10 characters.',
  })
  @MinLength(1, {
    message: 'The license plate field must contain at least 1 character.',
  })
  @IsNotEmpty({ message: 'The license plate field must not be empty.' })
  public readonly licensePlate: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: 'The manufacturer field must contain a maximum of 50 characters.',
  })
  public readonly manufacturer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: 'The model field must contain a maximum of 50 characters.',
  })
  public readonly model?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsInt()
  @Min(1900, { message: 'The year field must not be less than 1900.' })
  @Max(currentYear, {
    message: `The year field must not be greater than ${currentYear}.`,
  })
  public readonly year?: number;
}
