import { Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { PdfCompactService } from '../services/pdf-compact.service';
import { EmailService } from '../services/email.service';
export declare class ReceiptController {
    private readonly paymentService;
    private readonly pdfService;
    private readonly emailService;
    private readonly logger;
    constructor(paymentService: PaymentService, pdfService: PdfCompactService, emailService: EmailService);
    generateDirectReceipt(receiptData: any, res: Response): Promise<void>;
    downloadReceipt(receiptId: string, res: Response): Promise<void>;
    getReceiptByPaymentId(paymentId: string, res: Response): Promise<void>;
    getReceiptPdf(paymentId: string, res: Response): Promise<void>;
    sendReceiptEmail(receiptId: string): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
}
