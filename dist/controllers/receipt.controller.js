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
var ReceiptController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("../services/payment.service");
const pdf_compact_service_1 = require("../services/pdf-compact.service");
const email_service_1 = require("../services/email.service");
let ReceiptController = ReceiptController_1 = class ReceiptController {
    paymentService;
    pdfService;
    emailService;
    logger = new common_1.Logger(ReceiptController_1.name);
    constructor(paymentService, pdfService, emailService) {
        this.paymentService = paymentService;
        this.pdfService = pdfService;
        this.emailService = emailService;
    }
    async generateDirectReceipt(receiptData, res) {
        try {
            this.logger.log('Generating direct receipt');
            const directReceipt = await this.paymentService.createDirectReceipt(receiptData);
            const pdfBuffer = await this.pdfService.generateReceipt({
                receiptNumber: directReceipt.receiptNumber,
                date: new Date().toLocaleDateString('en-IN'),
                customerName: receiptData.customerName,
                customerEmail: receiptData.customerEmail,
                customerPhone: receiptData.customerPhone,
                customerAddress: receiptData.customerAddress,
                amount: parseFloat(receiptData.amount),
                paymentMode: receiptData.paymentMode,
                status: 'completed',
            });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="receipt-${directReceipt.receiptNumber}.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.send(pdfBuffer);
        }
        catch (error) {
            this.logger.error('Error generating direct receipt:', error);
            res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message,
            });
        }
    }
    async downloadReceipt(receiptId, res) {
        try {
            const receipt = await this.paymentService.findReceiptById(receiptId);
            if (!receipt) {
                throw new common_1.HttpException('Receipt not found', common_1.HttpStatus.NOT_FOUND);
            }
            const receiptData = {
                receiptNumber: receipt.receiptNumber,
                date: receipt.payment.createdAt.toLocaleDateString('en-IN'),
                customerName: receipt.payment.user.name,
                customerEmail: receipt.payment.user.email,
                customerPhone: receipt.payment.user.phone,
                customerAddress: receipt.payment.user.address,
                amount: receipt.payment.amount,
                paymentMode: receipt.payment.paymentMode,
                paymentId: receipt.payment.razorpayPaymentId,
                orderId: receipt.payment.razorpayOrderId,
                status: receipt.payment.status,
            };
            const pdfBuffer = await this.pdfService.generateReceipt(receiptData);
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="receipt-${receipt.receiptNumber}.pdf"`,
                'Content-Length': pdfBuffer.length,
            });
            res.send(pdfBuffer);
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to download receipt',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getReceiptByPaymentId(paymentId, res) {
        try {
            const payment = await this.paymentService.findPaymentById(paymentId);
            if (!payment) {
                throw new common_1.HttpException('Payment not found', common_1.HttpStatus.NOT_FOUND);
            }
            const receiptData = {
                receiptNumber: payment.receiptNumber,
                date: payment.createdAt.toLocaleDateString('en-IN'),
                customerName: payment.user.name,
                customerEmail: payment.user.email,
                customerPhone: payment.user.phone,
                customerAddress: payment.user.address,
                amount: payment.amount,
                paymentMode: payment.paymentMode,
                paymentId: payment.razorpayPaymentId,
                orderId: payment.razorpayOrderId,
                status: payment.status,
            };
            const pdfBuffer = await this.pdfService.generateReceipt(receiptData);
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="receipt-${payment.receiptNumber}.pdf"`,
                'Content-Length': pdfBuffer.length,
            });
            res.send(pdfBuffer);
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to generate receipt PDF',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getReceiptPdf(paymentId, res) {
        return this.getReceiptByPaymentId(paymentId, res);
    }
    async sendReceiptEmail(receiptId) {
        try {
            this.logger.log(`Sending receipt email for receipt ID: ${receiptId}`);
            const receipt = await this.paymentService.findReceiptById(receiptId);
            if (!receipt) {
                return {
                    success: false,
                    message: 'Receipt not found',
                };
            }
            const pdfBuffer = await this.pdfService.generateReceipt({
                receiptNumber: receipt.receiptNumber,
                date: new Date(receipt.generatedAt).toLocaleDateString('en-IN'),
                customerName: receipt.payment.user.name,
                customerEmail: receipt.payment.user.email,
                customerPhone: receipt.payment.user.phone,
                customerAddress: receipt.payment.user.address,
                amount: receipt.payment.amount,
                paymentMode: receipt.payment.paymentMode,
                status: receipt.payment.status,
            });
            await this.emailService.sendReceiptToClient(receipt.payment.user.email, receipt.payment.user.name, receipt.payment.amount, pdfBuffer, receipt.receiptNumber);
            await this.emailService.sendPaymentNotificationToAkrix(receipt.payment.user.name, receipt.payment.user.email, receipt.payment.amount, pdfBuffer, receipt.receiptNumber);
            return {
                success: true,
                message: 'Receipt emails sent successfully to both client and Akrix',
            };
        }
        catch (error) {
            this.logger.error('Error sending receipt email:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
};
exports.ReceiptController = ReceiptController;
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReceiptController.prototype, "generateDirectReceipt", null);
__decorate([
    (0, common_1.Get)('download/:receiptId'),
    __param(0, (0, common_1.Param)('receiptId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReceiptController.prototype, "downloadReceipt", null);
__decorate([
    (0, common_1.Get)('payment/:paymentId/pdf'),
    __param(0, (0, common_1.Param)('paymentId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReceiptController.prototype, "getReceiptByPaymentId", null);
__decorate([
    (0, common_1.Get)(':paymentId/pdf'),
    __param(0, (0, common_1.Param)('paymentId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReceiptController.prototype, "getReceiptPdf", null);
__decorate([
    (0, common_1.Post)('send-email/:receiptId'),
    __param(0, (0, common_1.Param)('receiptId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReceiptController.prototype, "sendReceiptEmail", null);
exports.ReceiptController = ReceiptController = ReceiptController_1 = __decorate([
    (0, common_1.Controller)('api/receipt'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService,
        pdf_compact_service_1.PdfCompactService,
        email_service_1.EmailService])
], ReceiptController);
//# sourceMappingURL=receipt.controller.js.map