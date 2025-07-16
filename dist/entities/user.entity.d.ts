import { Payment } from './payment.entity';
export declare class User {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    createdAt: Date;
    updatedAt: Date;
    payments: Payment[];
}
