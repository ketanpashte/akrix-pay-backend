import { ConfigService } from '@nestjs/config';
export declare class RazorpayService {
    private configService;
    private readonly logger;
    private razorpay;
    constructor(configService: ConfigService);
    createOrder(amount: number, currency?: string, receipt?: string): Promise<any>;
    verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<boolean>;
    getPaymentDetails(paymentId: string): Promise<any>;
}
