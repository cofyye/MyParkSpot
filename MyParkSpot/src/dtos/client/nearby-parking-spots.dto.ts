import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class NearbyParkingSpotsDto {
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @IsNotEmpty({ message: 'Latitude is required.' })
  public readonly lat: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @IsNotEmpty({ message: 'Longitude is required.' })
  public readonly lng: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0.1, { message: 'Radius must be greater than 0.' })
  @IsNotEmpty({ message: 'Radius is required.' })
  public readonly radius: number;
}
