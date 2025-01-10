import { IsNotEmpty } from 'class-validator';

export class ReadNotificationDto {
  @IsNotEmpty({ message: 'Redirect URL is required.' })
  public readonly redirectUrl: string;
}
