import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

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

  @IsString()
  @MaxLength(50, {
    message: 'The manufacturer field must contain a maximum of 50 characters.',
  })
  @IsNotEmpty({ message: 'The manufacturer field must not be empty.' })
  public readonly manufacturer: string;

  @IsString()
  @MaxLength(50, {
    message: 'The model field must contain a maximum of 50 characters.',
  })
  @IsNotEmpty({ message: 'The model field must not be empty.' })
  public readonly model: string;

  @Type(() => Number)
  @IsInt()
  @Min(1900, { message: 'The year field must not be less than 1900.' })
  @Max(new Date().getFullYear(), {
    message: 'The year field must not be greater than 2025.',
  })
  @IsNotEmpty({ message: 'The year field must not be empty.' })
  public readonly year: number;
}
