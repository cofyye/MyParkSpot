import { IsUUID } from 'class-validator';

export class ZoneIdDto {
  @IsUUID('4', { message: 'Zone ID must be a valid UUID' })
  zoneId: string;
}
