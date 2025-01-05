import { IsOptional, IsUUID } from 'class-validator';

export class SpotIdDto {
  @IsOptional()
  @IsUUID('4', { message: 'Spot ID must be a valid UUID.' })
  public readonly spotId: string;
}
