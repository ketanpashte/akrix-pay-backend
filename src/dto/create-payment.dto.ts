import { IsEmail, IsNotEmpty, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { PaymentMode } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentMode)
  paymentMode: PaymentMode;
}
