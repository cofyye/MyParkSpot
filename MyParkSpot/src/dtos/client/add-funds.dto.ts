import { IsEnum, IsInt, IsNotEmpty, Max, Min } from 'class-validator';
import { PaymentMethod } from '../../enums/payment-method.enum';
import { Transform } from 'class-transformer';

export class AddFundsDto {
  @Max(1000, {
    message: 'The maximum amount you can deposit is €1,000.',
  })
  @Min(5, { message: 'You must deposit a minimum of €5.' })
  @IsInt({ message: 'Amount field must be a number.' })
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  @IsNotEmpty({ message: 'The amount field must not be empty.' })
  public readonly amount: number;

  @IsEnum(PaymentMethod, {
    message: 'The payment method must be either PayPal or Stripe',
  })
  @IsNotEmpty({ message: 'Payment method is required.' })
  public readonly paymentMethod: string;
}
