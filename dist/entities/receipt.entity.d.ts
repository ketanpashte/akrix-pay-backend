import { Payment } from './payment.entity';
export declare class Receipt {
    id: string;
    paymentId: string;
    receiptNumber: string;
    generatedAt: Date;
    payment: Payment;
}
