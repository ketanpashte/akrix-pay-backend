import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User, Payment, Receipt, PaymentStatus, Admin } from '../entities';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Receipt)
    private receiptRepository: Repository<Receipt>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private configService: ConfigService,
  ) {}

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
    } catch (error) {
      console.error('Error creating default admin:', error);
    }
  }

  async authenticateAdmin(username: string, password: string) {
    try {
      const admin = await this.adminRepository.findOne({
        where: [
          { username: username },
          { email: username }
        ]
      });

      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
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
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async getAllReceipts(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    let whereCondition = {};
    if (search) {
      whereCondition = [
        { receiptNumber: Like(`%${search}%`) },
        { payment: { user: { name: Like(`%${search}%`) } } },
        { payment: { user: { email: Like(`%${search}%`) } } },
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

  async getAllPayments(page: number = 1, limit: number = 10, status?: string) {
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
      where: { status: PaymentStatus.COMPLETED },
    });
    const totalReceipts = await this.receiptRepository.count();
    const totalUsers = await this.userRepository.count();

    const totalRevenue = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
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
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
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
}
