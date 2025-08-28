import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class GetSpendingDataDto {
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt({ message: 'Days must be an integer.' })
  @Min(1, { message: 'Days must be at least 1.' })
  @Max(31, { message: 'Days cannot exceed 31.' })
  @IsNotEmpty({ message: 'Days parameter is required.' })
  public readonly days: number = 7;
}
