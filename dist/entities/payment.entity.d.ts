import { User } from './user.entity';
import { Receipt } from './receipt.entity';
export declare enum PaymentStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    SUCCESS = "success",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum PaymentMode {
    CASH = "cash",
    CARD = "card",
    UPI = "upi",
    NET_BANKING = "net_banking",
    WALLET = "wallet",
    CHEQUE = "cheque",
    BANK_TRANSFER = "bank_transfer"
}
export declare class Payment {
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
    receipt: Receipt;
}
