import { PaymentMode } from '../entities/payment.entity';
export declare class CreatePaymentDto {
    name: string;
    email: string;
    phone: string;
    address: string;
    amount: number;
    paymentMode: PaymentMode;
}
