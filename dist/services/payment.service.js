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
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let PaymentService = class PaymentService {
    userRepository;
    paymentRepository;
    receiptRepository;
    constructor(userRepository, paymentRepository, receiptRepository) {
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.receiptRepository = receiptRepository;
    }
    async initiatePayment(createPaymentDto) {
        let user = await this.userRepository.findOne({
            where: { email: createPaymentDto.email }
        });
        if (!user) {
            user = this.userRepository.create({
                name: createPaymentDto.name,
                email: createPaymentDto.email,
                phone: createPaymentDto.phone,
                address: createPaymentDto.address,
            });
            user = await this.userRepository.save(user);
        }
        const payment = this.paymentRepository.create({
            userId: user.id,
            amount: createPaymentDto.amount,
            paymentMode: createPaymentDto.paymentMode,
            status: entities_1.PaymentStatus.PENDING,
        });
        const savedPayment = await this.paymentRepository.save(payment);
        const receiptNumber = this.generateReceiptNumber();
        savedPayment.receiptNumber = receiptNumber;
        await this.paymentRepository.save(savedPayment);
        return savedPayment;
    }
    async verifyPayment(verifyPaymentDto) {
        const payment = await this.paymentRepository.findOne({
            where: { id: verifyPaymentDto.paymentId },
            relations: ['user']
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        const isVerified = true;
        if (isVerified) {
            payment.status = entities_1.PaymentStatus.COMPLETED;
            payment.razorpayPaymentId = verifyPaymentDto.razorpayPaymentId;
            payment.razorpayOrderId = verifyPaymentDto.razorpayOrderId;
            payment.razorpaySignature = verifyPaymentDto.razorpaySignature;
            await this.paymentRepository.save(payment);
            const receiptNumber = this.generateReceiptNumber();
            const receipt = this.receiptRepository.create({
                paymentId: payment.id,
                receiptNumber,
            });
            const savedReceipt = await this.receiptRepository.save(receipt);
            return {
                success: true,
                receiptId: savedReceipt.id,
                receiptNumber: savedReceipt.receiptNumber,
                payment: {
                    id: payment.id,
                    amount: payment.amount,
                    status: payment.status,
                    paymentMode: payment.paymentMode,
                    createdAt: payment.createdAt,
                },
                user: payment.user,
            };
        }
        return { success: false, message: 'Payment verification failed' };
    }
    async getReceipt(receiptId) {
        const receipt = await this.receiptRepository.findOne({
            where: { id: receiptId },
            relations: ['payment', 'payment.user']
        });
        if (!receipt) {
            throw new common_1.NotFoundException('Receipt not found');
        }
        return {
            receipt: {
                id: receipt.id,
                receiptNumber: receipt.receiptNumber,
                generatedAt: receipt.generatedAt,
            },
            payment: {
                id: receipt.payment.id,
                amount: receipt.payment.amount,
                paymentMode: receipt.payment.paymentMode,
                status: receipt.payment.status,
                createdAt: receipt.payment.createdAt,
                razorpayPaymentId: receipt.payment.razorpayPaymentId,
                razorpayOrderId: receipt.payment.razorpayOrderId,
            },
            user: receipt.payment.user,
        };
    }
    generateReceiptNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        return `AKRX-${year}${month}${day}-${random}`;
    }
    async updatePaymentStatus(paymentId, status, razorpayPaymentId, razorpayOrderId) {
        const payment = await this.paymentRepository.findOne({
            where: { id: paymentId },
            relations: ['user']
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        payment.status = status;
        if (razorpayPaymentId)
            payment.razorpayPaymentId = razorpayPaymentId;
        if (razorpayOrderId)
            payment.razorpayOrderId = razorpayOrderId;
        const updatedPayment = await this.paymentRepository.save(payment);
        if (status === 'completed') {
            await this.createReceiptFromPayment(updatedPayment);
        }
        return updatedPayment;
    }
    async createDirectReceipt(receiptData) {
        let user = await this.userRepository.findOne({
            where: { email: receiptData.customerEmail }
        });
        if (!user) {
            user = this.userRepository.create({
                name: receiptData.customerName,
                email: receiptData.customerEmail,
                phone: receiptData.customerPhone,
                address: receiptData.customerAddress,
            });
            user = await this.userRepository.save(user);
        }
        const payment = this.paymentRepository.create({
            userId: user.id,
            amount: receiptData.amount,
            paymentMode: receiptData.paymentMode,
            status: entities_1.PaymentStatus.COMPLETED,
            receiptNumber: this.generateReceiptNumber(),
        });
        const savedPayment = await this.paymentRepository.save(payment);
        const receipt = await this.createReceiptFromPayment(savedPayment);
        return {
            ...savedPayment,
            receipt,
        };
    }
    async createReceiptFromPayment(payment) {
        const receipt = this.receiptRepository.create({
            paymentId: payment.id,
            receiptNumber: payment.receiptNumber,
        });
        return await this.receiptRepository.save(receipt);
    }
    async generateReceiptForPayment(paymentId) {
        const payment = await this.paymentRepository.findOne({
            where: { id: paymentId },
            relations: ['user'],
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        let receipt = await this.receiptRepository.findOne({
            where: { paymentId: payment.id },
        });
        if (!receipt) {
            receipt = this.receiptRepository.create({
                paymentId: payment.id,
                receiptNumber: payment.receiptNumber,
            });
            receipt = await this.receiptRepository.save(receipt);
        }
        return {
            receiptId: receipt.id,
            receiptNumber: receipt.receiptNumber,
            payment: payment,
        };
    }
    async findReceiptById(receiptId) {
        return await this.receiptRepository.findOne({
            where: { id: receiptId },
            relations: ['payment', 'payment.user'],
        });
    }
    async findPaymentById(paymentId) {
        return await this.paymentRepository.findOne({
            where: { id: paymentId },
            relations: ['user'],
        });
    }
    async processQRPayment(qrPaymentData) {
        try {
            const qrPaymentDataWithMode = {
                ...qrPaymentData,
                paymentMode: entities_1.PaymentMode.UPI,
            };
            const paymentRecord = await this.initiatePayment(qrPaymentDataWithMode);
            return {
                success: true,
                paymentId: paymentRecord.id,
                message: 'QR payment initiated. Please complete payment and submit UTR.',
                qrData: {
                    amount: qrPaymentData.amount,
                    description: qrPaymentData.description || 'Payment to Akrix',
                }
            };
        }
        catch (error) {
            throw new Error(`QR payment processing failed: ${error.message}`);
        }
    }
    async verifyUTRPayment(utrData) {
        try {
            const { paymentId, utrNumber, screenshot } = utrData;
            const payment = await this.paymentRepository.findOne({
                where: { id: paymentId },
                relations: ['user'],
            });
            if (!payment) {
                throw new common_1.NotFoundException('Payment not found');
            }
            const isValidUTR = this.validateUTR(utrNumber);
            if (!isValidUTR) {
                return {
                    success: false,
                    message: 'Invalid UTR number format',
                };
            }
            payment.razorpayPaymentId = utrNumber;
            payment.status = entities_1.PaymentStatus.COMPLETED;
            payment.updatedAt = new Date();
            const updatedPayment = await this.paymentRepository.save(payment);
            const receipt = await this.generateReceiptForPayment(payment.id);
            return {
                success: true,
                message: 'Payment verified successfully',
                payment: updatedPayment,
                receipt: receipt,
                utrNumber: utrNumber,
            };
        }
        catch (error) {
            throw new Error(`UTR verification failed: ${error.message}`);
        }
    }
    validateUTR(utrNumber) {
        const utrRegex = /^\d{12}$/;
        return utrRegex.test(utrNumber);
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Payment)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Receipt)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PaymentService);
//# sourceMappingURL=payment.service.js.map