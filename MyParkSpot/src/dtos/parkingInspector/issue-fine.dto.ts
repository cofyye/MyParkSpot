import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class IssueFineDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 15)
  licensePlate: string;

  @IsUUID()
  @IsNotEmpty()
  parkingSpotId: string;
}
