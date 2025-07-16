import { AdminService } from '../services/admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    adminLogin(loginData: {
        username: string;
        password: string;
    }): Promise<{
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
        receipts: import("../entities").Receipt[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getAllPayments(page?: number, limit?: number, status?: string): Promise<{
        payments: import("../entities").Payment[];
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
        recentPayments: import("../entities").Payment[];
        monthlyStats: any[];
    }>;
}
