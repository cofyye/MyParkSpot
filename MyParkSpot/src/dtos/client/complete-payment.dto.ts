import { IsEnum, IsNotEmpty } from 'class-validator';
import { PaymentMethod } from '../../enums/payment-method.enum';

export class CompletePaymentDto {
  @IsNotEmpty({ message: 'The session_id field must not be empty.' })
  public readonly session_id: string;

  @IsEnum(PaymentMethod, {
    message: 'The payment method must be either PayPal or Stripe',
  })
  @IsNotEmpty({ message: 'The payment type field must not be empty.' })
  public readonly payment_method: string;
}
