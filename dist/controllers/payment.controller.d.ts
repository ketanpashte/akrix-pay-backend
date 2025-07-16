import { Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { RazorpayService } from '../services/razorpay.service';
import { PdfCompactService } from '../services/pdf-compact.service';
import { CreatePaymentDto } from '../dto';
export declare class PaymentController {
    private readonly paymentService;
    private readonly razorpayService;
    private readonly pdfService;
    private readonly logger;
    constructor(paymentService: PaymentService, razorpayService: RazorpayService, pdfService: PdfCompactService);
    createRazorpayOrder(createPaymentDto: CreatePaymentDto): Promise<{
        success: boolean;
        orderId: any;
        amount: any;
        currency: any;
        paymentId: string;
        receiptNumber: string;
        key: string | undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        orderId?: undefined;
        amount?: undefined;
        currency?: undefined;
        paymentId?: undefined;
        receiptNumber?: undefined;
        key?: undefined;
    }>;
    verifyRazorpayPayment(verifyData: any): Promise<{
        success: boolean;
        message: string;
        payment: import("../entities").Payment;
        receipt: {
            receiptId: string;
            receiptNumber: string;
            payment: import("../entities").Payment;
        };
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        payment?: undefined;
        receipt?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
        payment?: undefined;
        receipt?: undefined;
    }>;
    initiatePayment(createPaymentDto: CreatePaymentDto): Promise<import("../entities").Payment>;
    processQRPayment(qrPaymentData: any): Promise<{
        success: boolean;
        paymentId: string;
        message: string;
        qrData: {
            amount: any;
            description: any;
        };
    }>;
    verifyUTRPayment(utrData: any): Promise<{
        success: boolean;
        message: string;
        payment?: undefined;
        receipt?: undefined;
        utrNumber?: undefined;
    } | {
        success: boolean;
        message: string;
        payment: import("../entities").Payment;
        receipt: {
            receiptId: string;
            receiptNumber: string;
            payment: import("../entities").Payment;
        };
        utrNumber: any;
    }>;
}
export declare class ReceiptController {
    private readonly paymentService;
    private readonly pdfService;
    private readonly logger;
    constructor(paymentService: PaymentService, pdfService: PdfCompactService);
    getReceipt(id: string): Promise<{
        receipt: {
            id: string;
            receiptNumber: string;
            generatedAt: Date;
        };
        payment: {
            id: string;
            amount: number;
            paymentMode: import("../entities").PaymentMode;
            status: import("../entities").PaymentStatus;
            createdAt: Date;
            razorpayPaymentId: string;
            razorpayOrderId: string;
        };
        user: import("../entities").User;
    }>;
    downloadReceiptPdf(id: string, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    generateDirectReceipt(receiptData: any, res: Response): Promise<void>;
}
