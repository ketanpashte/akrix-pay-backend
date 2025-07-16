import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User, Payment, Receipt, Admin } from '../entities';
import { ConfigService } from '@nestjs/config';
export declare class AdminService implements OnModuleInit {
    private userRepository;
    private paymentRepository;
    private receiptRepository;
    private adminRepository;
    private configService;
    constructor(userRepository: Repository<User>, paymentRepository: Repository<Payment>, receiptRepository: Repository<Receipt>, adminRepository: Repository<Admin>, configService: ConfigService);
    onModuleInit(): Promise<void>;
    createDefaultAdmin(): Promise<void>;
    authenticateAdmin(username: string, password: string): Promise<{
        success: boolean;
        message: string;
        token: string;
        admin: {
            id: string;
            username: string;
            email: string;
            name: string;
            role: string;
        };
    }>;
    getAllReceipts(page?: number, limit?: number, search?: string): Promise<{
        receipts: Receipt[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getAllPayments(page?: number, limit?: number, status?: string): Promise<{
        payments: Payment[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getDashboardStats(): Promise<{
        overview: {
            totalPayments: number;
            successfulPayments: number;
            totalReceipts: number;
            totalUsers: number;
            totalRevenue: any;
            successRate: number;
        };
        recentPayments: Payment[];
        monthlyStats: any[];
    }>;
}
