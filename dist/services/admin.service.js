"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
let AdminService = class AdminService {
    userRepository;
    paymentRepository;
    receiptRepository;
    adminRepository;
    configService;
    constructor(userRepository, paymentRepository, receiptRepository, adminRepository, configService) {
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.receiptRepository = receiptRepository;
        this.adminRepository = adminRepository;
        this.configService = configService;
    }
    async onModuleInit() {
        await this.createDefaultAdmin();
    }
    async createDefaultAdmin() {
        try {
            const existingAdmin = await this.adminRepository.findOne({
                where: { username: 'admin@akrix.com' }
            });
            if (!existingAdmin) {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                const defaultAdmin = this.adminRepository.create({
                    username: 'admin@akrix.com',
                    email: 'admin@akrix.com',
                    password: hashedPassword,
                    name: 'Akrix Admin',
                    role: 'super_admin',
                    isActive: true,
                });
                await this.adminRepository.save(defaultAdmin);
                console.log('✅ Default admin created: admin@akrix.com / admin123');
            }
        }
        catch (error) {
            console.error('Error creating default admin:', error);
        }
    }
    async authenticateAdmin(username, password) {
        try {
            const admin = await this.adminRepository.findOne({
                where: [
                    { username: username },
                    { email: username }
                ]
            });
            if (!admin || !admin.isActive) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const isPasswordValid = await bcrypt.compare(password, admin.password);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            return {
                success: true,
                message: 'Authentication successful',
                token: `admin-${admin.id}`,
                admin: {
                    id: admin.id,
                    username: admin.username,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role,
                },
            };
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Authentication failed');
        }
    }
    async getAllReceipts(page = 1, limit = 10, search) {
        const skip = (page - 1) * limit;
        let whereCondition = {};
        if (search) {
            whereCondition = [
                { receiptNumber: (0, typeorm_2.Like)(`%${search}%`) },
                { payment: { user: { name: (0, typeorm_2.Like)(`%${search}%`) } } },
                { payment: { user: { email: (0, typeorm_2.Like)(`%${search}%`) } } },
            ];
        }
        const [receipts, total] = await this.receiptRepository.findAndCount({
            where: whereCondition,
            relations: ['payment', 'payment.user'],
            order: { generatedAt: 'DESC' },
            skip,
            take: limit,
        });
        return {
            receipts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getAllPayments(page = 1, limit = 10, status) {
        const skip = (page - 1) * limit;
        let whereCondition = {};
        if (status) {
            whereCondition = { status };
        }
        const [payments, total] = await this.paymentRepository.findAndCount({
            where: whereCondition,
            relations: ['user', 'receipt'],
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
        return {
            payments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getDashboardStats() {
        const totalPayments = await this.paymentRepository.count();
        const successfulPayments = await this.paymentRepository.count({
            where: { status: entities_1.PaymentStatus.COMPLETED },
        });
        const totalReceipts = await this.receiptRepository.count();
        const totalUsers = await this.userRepository.count();
        const totalRevenue = await this.paymentRepository
            .createQueryBuilder('payment')
            .select('SUM(payment.amount)', 'total')
            .where('payment.status = :status', { status: entities_1.PaymentStatus.COMPLETED })
            .getRawOne();
        const recentPayments = await this.paymentRepository.find({
            relations: ['user'],
            order: { createdAt: 'DESC' },
            take: 5,
        });
        const monthlyStats = await this.paymentRepository
            .createQueryBuilder('payment')
            .select([
            'EXTRACT(MONTH FROM payment.createdAt) as month',
            'EXTRACT(YEAR FROM payment.createdAt) as year',
            'COUNT(*) as count',
            'SUM(payment.amount) as revenue',
        ])
            .where('payment.status = :status', { status: entities_1.PaymentStatus.COMPLETED })
            .andWhere('payment.createdAt >= :date', {
            date: new Date(new Date().getFullYear(), 0, 1)
        })
            .groupBy('EXTRACT(MONTH FROM payment.createdAt), EXTRACT(YEAR FROM payment.createdAt)')
            .orderBy('year, month')
            .getRawMany();
        return {
            overview: {
                totalPayments,
                successfulPayments,
                totalReceipts,
                totalUsers,
                totalRevenue: totalRevenue?.total || 0,
                successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
            },
            recentPayments,
            monthlyStats,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Payment)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Receipt)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.Admin)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], AdminService);
//# sourceMappingURL=admin.service.js.map