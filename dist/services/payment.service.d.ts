import { Repository } from 'typeorm';
import { User, Payment, Receipt, PaymentStatus, PaymentMode } from '../entities';
import { CreatePaymentDto, VerifyPaymentDto } from '../dto';
export declare class PaymentService {
    private userRepository;
    private paymentRepository;
    private receiptRepository;
    constructor(userRepository: Repository<User>, paymentRepository: Repository<Payment>, receiptRepository: Repository<Receipt>);
    initiatePayment(createPaymentDto: CreatePaymentDto): Promise<Payment>;
    verifyPayment(verifyPaymentDto: VerifyPaymentDto): Promise<{
        success: boolean;
        receiptId: string;
        receiptNumber: string;
        payment: {
            id: string;
            amount: number;
            status: PaymentStatus.COMPLETED;
            paymentMode: PaymentMode;
            createdAt: Date;
        };
        user: User;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        receiptId?: undefined;
        receiptNumber?: undefined;
        payment?: undefined;
        user?: undefined;
    }>;
    getReceipt(receiptId: string): Promise<{
        receipt: {
            id: string;
            receiptNumber: string;
            generatedAt: Date;
        };
        payment: {
            id: string;
            amount: number;
            paymentMode: PaymentMode;
            status: PaymentStatus;
            createdAt: Date;
            razorpayPaymentId: string;
            razorpayOrderId: string;
        };
        user: User;
    }>;
    private generateReceiptNumber;
    updatePaymentStatus(paymentId: string, status: string, razorpayPaymentId?: string, razorpayOrderId?: string): Promise<Payment>;
    createDirectReceipt(receiptData: any): Promise<{
        receipt: Receipt;
        id: string;
        userId: string;
        amount: number;
        paymentMode: PaymentMode;
        status: PaymentStatus;
        razorpayPaymentId: string;
        razorpayOrderId: string;
        razorpaySignature: string;
        receiptNumber: string;
        createdAt: Date;
        updatedAt: Date;
        user: User;
    }>;
    private createReceiptFromPayment;
    generateReceiptForPayment(paymentId: string): Promise<{
        receiptId: string;
        receiptNumber: string;
        payment: Payment;
    }>;
    findReceiptById(receiptId: string): Promise<Receipt | null>;
    findPaymentById(paymentId: string): Promise<Payment | null>;
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
        payment: Payment;
        receipt: {
            receiptId: string;
            receiptNumber: string;
            payment: Payment;
        };
        utrNumber: any;
    }>;
    private validateUTR;
}
