import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private readonly logger;
    private transporter;
    constructor(configService: ConfigService);
    private initializeTransporter;
    sendReceiptToClient(clientEmail: string, clientName: string, amount: number, receiptBuffer: Buffer, receiptNumber: string): Promise<{
        success: boolean;
        message: string;
    }>;
    sendPaymentNotificationToAkrix(clientName: string, clientEmail: string, amount: number, receiptBuffer: Buffer, receiptNumber: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
