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
export declare class PdfCompactService {
    private readonly logger;
    generateReceipt(receiptData: ReceiptData): Promise<Buffer>;
    private generateCompactPDF;
    private addHeader;
    private addReceiptTitle;
    private addDetailsSection;
    private addTotalSection;
    private addFooter;
}
