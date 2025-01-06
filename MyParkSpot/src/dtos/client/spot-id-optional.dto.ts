import { IsOptional, IsUUID } from 'class-validator';

export class SpotIdOptionalDto {
  @IsOptional()
  @IsUUID('4', { message: 'Spot ID must be a valid UUID.' })
  public readonly spotId: string;
}
