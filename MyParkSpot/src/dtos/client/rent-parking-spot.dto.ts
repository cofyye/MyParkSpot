import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

type minutes = number;

export class RentParkingSpotDto {
  @Type(() => Number)
  @IsInt({ message: 'Parking duration must be an integer.' })
  public readonly parkingDuration: minutes;

  @IsString()
  @IsNotEmpty({ message: 'Car ID is required.' })
  public readonly carId: string;

  @IsString()
  @IsNotEmpty({ message: 'Parking spot ID is required.' })
  public readonly parkingSpotId: string;
}
