export interface ReceiptData {
    receiptNumber: string;
    date: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    amount: number;
    paymentMode: string;
    paymentId?: string;
    orderId?: string;
    status: string;
}
export declare class PdfService {
    private readonly logger;
    generateReceipt(receiptData: ReceiptData): Promise<Buffer>;
    private generatePDF;
    private addHeader;
    private addReceiptTitle;
    private addCustomerDetails;
    private addPaymentDetails;
    private addFooter;
}
