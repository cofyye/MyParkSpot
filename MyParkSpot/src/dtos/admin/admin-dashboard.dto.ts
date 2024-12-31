import { IsOptional, IsString, Matches } from 'class-validator';

export class AdminDashboardDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'currentMonth must be in YYYY-MM format',
  })
  month?: string;
}
